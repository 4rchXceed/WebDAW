import { AudioChannel } from "./AudioChannel.js";

export class AudioMgr {
    constructor() {
        this.channels = {}; // The master channel
        this.bufferTime = 0.3; // Default buffer time in seconds
        this.instruments = {};
        this.instrumentIndex = 0;
        this.currentPlaybackInterval = null; // Store the interval for updating the playback, so we can clear it when needed
        this.currentBeat = 0; // This is used to store the current time percent of the song. This is mostly used for UI.
    }

    // Called *after* the project is loaded
    init() {
        window.webDaw.eventSystem.createEvent("playbackStarted");
        window.webDaw.eventSystem.createEvent("playbackStopped");
        if (!window.webDaw.project.channels[0]) { // Avoid recreating if loading from a project that already has channels
            this.createChannel("Default", 0); // Create the master channel !! THERE'S NO ROUTING FOR NOW, SO CHANNEL 1 for example, will NOT output to the master channel, it will output directly to the audio output
        }
    }

    createChannelAuto(name) {
        let i = 0;
        while (this.channels[i]) {
            i++;
        }
        return [this.createChannel(name, i), i];
    }

    createChannel(name, index) {
        const channel = new AudioChannel(name);
        channel.init();
        this.channels[index] = channel;
        return channel;
    }

    removeChannel(index) {
        if (index === 0) {
            window.error(false, "AudioMgr: Cannot remove master channel.");
            return;
        }
        if (!this.channels[index]) {
            window.error(false, `AudioMgr: Channel with index ${index} not found.`);
            return;
        }
        this.channels[index].tearDown(); // Stop the audioContext
        delete this.channels[index];
    }

    play(instrumentId, parameters) {
        console.log(instrumentId, parameters);

        if (!this.instruments[instrumentId]) {
            window.error(false, `AudioMgr: Instrument with id ${instrumentId} not found.`);
            return;
        }
        this.instruments[instrumentId].play(parameters);
    }

    async loadInstrument(unloadedInstrumentId, channel = 0, name = "Untitled Instrument", preDefinedPresets = null, preDefinedId = null) {
        window.webDaw.project.songData.instrumentData[this.instrumentIndex] = {
            name,
            parts: {},
        };
        const InstrumentClass = await window.webDaw.globalRegistry.instruments[unloadedInstrumentId]?.class;
        const instrumentInstance = new InstrumentClass();
        await instrumentInstance.init();
        instrumentInstance.updateChannel(channel);
        if (!!preDefinedPresets) {
            instrumentInstance.loadParameters(preDefinedPresets);
        }
        if (!!preDefinedId) {
            this.instruments[preDefinedId] = instrumentInstance;
            if (preDefinedId >= this.instrumentIndex) {
                this.instrumentIndex = preDefinedId + 1;
            }
            // this.save(); // We don't need to save here because this is only used when loading a project, and the project will be saved after loading all the instruments
            return preDefinedId;
        } else {
            const id = this.instrumentIndex++;
            this.instruments[id] = instrumentInstance;
            this.save();
            return id;
        }
    }

    unloadInstrument(instrumentId, deleteInstrumentData = true) {
        if (!this.instruments[instrumentId]) {
            window.error(false, `AudioMgr: Instrument with id ${instrumentId} not found.`);
            return;
        }
        if (deleteInstrumentData) {
            delete window.webDaw.project.songData.instrumentData[instrumentId]; // Remove the instrument data from the project
        }
        this.instruments[instrumentId].tearDown(); // Tear down the instrument (remove generated HTML, cancel events, ...)
        delete this.instruments[instrumentId];
        this.save();
    }

    updateInstrument(instrumentId, newUnloadedInstrumentId) {
        if (!this.instruments[instrumentId]) {
            window.error(false, `AudioMgr: Instrument with id ${instrumentId} not found.`);
            return;
        }
        const InstrumentClass = window.webDaw.globalRegistry.instruments[newUnloadedInstrumentId]?.class;
        if (!InstrumentClass) {
            window.error(false, `AudioMgr: Instrument class for id ${newUnloadedInstrumentId} not found.`);
            return;
        }
        const newInstrumentInstance = new InstrumentClass();
        newInstrumentInstance.init();
        newInstrumentInstance.updateChannel(this.instruments[instrumentId].currentChannel);
        this.unloadInstrument(instrumentId, false); // Unload the current instrument
        this.instruments[instrumentId] = newInstrumentInstance;
        this.save();
    }

    /**
     * Play the song from the specified time. This will start the playback and update the state of the instruments accordingly.
     * @param {number} startAt The time in seconds from which to start the playback. This is relative to the start of the song, so if you want to start from the beginning, this should be 0.
     * !! *For now*, if you start the playback from the middle of a part, the part won't be played, it will only start playing when the playback reaches the start of the part. !!
     */
    playSong(startAt) {
        const project = window.webDaw.project;
        const songData = project.songData;
        const tempo = songData.tempo;
        const startTime = Date.now() - startAt * 1000;
        if (this.currentPlaybackInterval) {
            window.webDaw.eventSystem.emitEvent("playbackStopped");
            clearInterval(this.currentPlaybackInterval);
        }
        const currentParts = {}; // {instrumentId: partData} Store the currently playing parts for each instrument, so we can check when a part starts or stops playing
        window.webDaw.eventSystem.emitEvent("playbackStarted", { startAt });
        this.currentPlaybackInterval = setInterval(() => {
            const currentTime = (Date.now() - startTime) / 1000; // Current time in seconds
            this.currentBeat = (currentTime * tempo) / 60; // Current beat
            for (const instrumentId in songData.instrumentData) {
                const shouldBePlayingPartId = Object.keys(songData.instrumentData[instrumentId].parts).find(partId => {
                    const part = songData.instrumentData[instrumentId].parts[partId];
                    return this.currentBeat >= part.startTime && this.currentBeat < part.startTime + part.duration; // Starttime and duration are in beats
                });
                if (shouldBePlayingPartId) {
                    let shouldStartPlaying = false;
                    if (currentParts[instrumentId]) {
                        if (currentParts[instrumentId].partId !== shouldBePlayingPartId) {
                            // The part that should be playing is different from the currently playing part, so we need to stop the current part and start the new part
                            currentParts[instrumentId].playerInstance.stopPlaying();
                            shouldStartPlaying = true;
                        } else {
                            // The part is already playing, update
                            currentParts[instrumentId].playerInstance.update(currentTime - currentParts[instrumentId].partStartTime, this.currentBeat - currentParts[instrumentId].partStartBeat);
                        }
                    } else {
                        shouldStartPlaying = true;
                    }
                    if (shouldStartPlaying) {
                        const currentPart = songData.instrumentData[instrumentId].parts[shouldBePlayingPartId];
                        const dataType = currentPart.dataType || "raw";
                        const partPlayerClass = window.webDaw.globalRegistry.partPlayers[dataType];
                        if (partPlayerClass) {
                            const partPlayerInstance = new partPlayerClass();
                            partPlayerInstance.startPlaying(currentPart.data, instrumentId);
                            currentParts[instrumentId] = { partId: shouldBePlayingPartId, playerInstance: partPlayerInstance, partStartTime: currentPart.startTime * (60 / tempo), partStartBeat: currentPart.startTime };
                        } else {
                            window.warn(`No PartPlayer plugin found for data type "${dataType}", cannot play part with id ${shouldBePlayingPartId} for instrument with id ${instrumentId}`);
                        }
                    }
                }
            }
        });
    }

    pauseSong() {
        if (this.currentPlaybackInterval) {
            window.webDaw.eventSystem.emitEvent("playbackStopped");
            clearInterval(this.currentPlaybackInterval);
            this.currentPlaybackInterval = null;
        }
    }

    save() {
        const instruments = {};
        for (const instrumentId in this.instruments) {
            const instrumentData = this.instruments[instrumentId].saveParameters();
            instruments[instrumentId] = {
                data: instrumentData,
                id: this.instruments[instrumentId].instrumentId,
                channel: this.instruments[instrumentId].currentChannel,
            };
        }

        const effects = {};
        for (const channelIndex in this.channels) {
            const channel = this.channels[channelIndex];
            effects[channelIndex] = {
                data: channel.saveState(),
                name: channel.name,
            };
        }

        window.webDaw.project.loadedInstruments = instruments; // Store the instrument data in the project, so it can be loaded later
        window.webDaw.project.channels = effects; // Store the effect data in the project, so it can be loaded later
    }

    load() {
        const project = window.webDaw.project;
        const instrumentsData = project.loadedInstruments;
        for (const instrumentId in instrumentsData) {
            const instrumentInfo = instrumentsData[instrumentId];
            this.loadInstrument(instrumentInfo.id, instrumentInfo.channel, instrumentInfo.name ?? "", instrumentInfo.data, instrumentId);
        }
        for (const channelIndex in project.channels) {
            const channelData = project.channels[channelIndex];
            this.createChannel(channelData.name, channelIndex).loadState(channelData.data);
        }
    }
}
