import { AudioChannel } from "./AudioChannel.js";

export class AudioMgr {
    constructor() {
        this.channels = {}; // The master channel
        this.bufferTime = 0.3; // Default buffer time in seconds
        this.instruments = {};
        this.createChannel("Master", 0); // Create the master channel
        this.instrumentIndex = 0;
    }

    createChannel(name, index) {
        const channel = new AudioChannel(name);
        channel.init();
        this.channels[index] = channel;
        return channel;
    }

    play(instrumentId, parameters) {
        if (!this.instruments[instrumentId]) {
            window.error(false, `AudioMgr: Instrument with id ${instrumentId} not found.`);
            return;
        }
        this.instruments[instrumentId].play(parameters);
    }

    async loadInstrument(unloadedInstrumentId, channel = 0, name = "Untitled Instrument") {
        window.webDaw.project.songData.instrumentData[this.instrumentIndex] = {
            name,
            parts: {},
        };
        const InstrumentClass = await window.webDaw.globalRegistry.instruments[unloadedInstrumentId]?.class;
        const instrumentInstance = new InstrumentClass();
        await instrumentInstance.init();
        instrumentInstance.updateChannel(channel);
        const id = this.instrumentIndex++;
        this.instruments[id] = instrumentInstance;
        return id;
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
    }
}