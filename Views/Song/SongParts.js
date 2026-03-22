import { ViewTemplate } from "../Template/ViewTemplate.js";

class SongPart {
    constructor(name, duration, startTime, songParts = null) {
        this.name = name;
        this.duration = duration;
        this.startTime = startTime;
        this.instrument = songParts; // reference to the parent SongParts instance
        this.element = null; // will hold the DOM element once generated
        this.partNameElement = null; // reference to the span element that displays the part name
        this.partId = null;
        this.isSelected = false;
    }

    gen() {
        this.element = document.createElement("li");
        this.element.classList.add("song-part-part");
        this.partNameElement = document.createElement("span");
        this.partNameElement.textContent = this.name;
        this.partNameElement.classList.add("song-part-name");
        this.element.appendChild(this.partNameElement);
        const resizeSpan = document.createElement("span");
        resizeSpan.classList.add("song-part-resize");
        this.element.appendChild(resizeSpan);
        this.instrument.partsContainer.appendChild(this.element);
        this.element.addEventListener("click", () => {
            this.instrument.songParts.app__setCurrentPart(this.instrument.instrumentId, this.startTime);
            this.instrument.songParts.instruments.forEach(i => i.parts.forEach(p => { p.element.classList.remove("song-parts-selected"); p.isSelected = false; }));
            this.element.classList.add("song-parts-selected");
            this.isSelected = true;
        });
        this.element.addEventListener("dblclick", () => {
            this.partNameElement.contentEditable = true; // What a good idea!
            this.partNameElement.focus();
        });
        this.partNameElement.addEventListener("blur", () => {
            this.partNameElement.contentEditable = false;
            this.partNameElement.textContent = this.partNameElement.textContent.replace("<br>", ""); // prevent line breaks
            this.partNameElement.textContent = this.partNameElement.textContent.trim() || "Untitled Part"; // prevent empty names
            this.name = this.partNameElement.textContent;
            this.instrument.songParts.modified();
            const project = this.instrument.songParts.app__getProject();
            project.songData.instrumentData[this.instrument.instrumentId].parts[this.startTime].name = this.name;
        });
        this.updatePosition();
    }

    updatePosition() {
        this.element.style.left = `${this.instrument.convertBeatsToPx(this.startTime)}px`;
        this.element.style.width = `${this.instrument.convertBeatsToPx(this.duration)}px`;
    }
}

class Instrument {
    constructor(name, instrumentId = null, songParts = null) {
        this.name = name;
        this.partsContainer = null;
        this.parts = [];
        this.pixelsPerBeat = 10;
        this.isMouseDown = false;
        this.currentElement = null;
        this.isDragging = false;
        this.gridSnapInterval = 10; // in beats
        this.snapToGridMin = 1;
        this.channelSpanElement = null;
        this.instrumentId = instrumentId;
        this.instrumentTypeSelect = null;
        this.songParts = songParts; // reference to the parent SongParts instance
        this.instrumentNameInput = null;
    }

    convertBeatsToPx(beats) {
        return beats * this.pixelsPerBeat;
    }

    convertPxToBeats(px) {
        return px / this.pixelsPerBeat;
    }

    isPartValid(startTime, duration, excludePart = null) {
        return startTime < 0 || startTime + duration > this.songParts.songLength || this.parts.some(p => p !== excludePart && !(p.startTime + p.duration <= startTime || p.startTime >= startTime + duration));
    }

    remove(mod = true) {
        this.parts.forEach(part => {
            this.partsContainer.removeChild(part.element);
        });
        this.parts = [];
        this.songParts.instrumentsContainer.removeChild(this.element);
        this.songParts.instruments = this.songParts.instruments.filter(i => i !== this);
        if (mod) {
            this.songParts.modified();
        }
        if (this.songParts.openedUIInstrument) { // If the removed instrument's GUI is open, close it
            this.songParts.openedUIInstrument.element.classList.remove("song-parts-instrument-selected");
        }
        this.songParts.openedUIInstrument = null;
        this.songParts.app__getAudioManager().unloadInstrument(this.instrumentId);
    }

    gen() {
        const template = this.songParts.INSTRUMENT_TEMPLATE;
        this.songParts.instrumentsContainer.insertAdjacentHTML("beforeend", template);
        this.element = this.songParts.instrumentsContainer.lastElementChild;
        this.instrumentNameInput = this.element.querySelector(".song-parts-instrument-name");
        this.instrumentNameInput.value = this.name;
        this.element.querySelector(".song-parts-instrument-edit").addEventListener("click", () => {
            const input = this.instrumentNameInput;
            input.readOnly = false;
            input.focus();
        });
        this.instrumentNameInput.addEventListener("dblclick", () => {
            this.songParts.openGUI(this);
        });
        this.element.querySelector(".song-parts-instrument-remove").addEventListener("click", () => {
            this.remove();
        });
        this.partsScroll = this.element.querySelector(".song-part-parts-container");

        this.instrumentNameInput.addEventListener("blur", () => {
            const input = this.instrumentNameInput;
            input.readOnly = true;
            this.name = input.value;
            this.songParts.modified();
            const project = this.songParts.app__getProject();
            if (project.songData.instrumentData[this.instrumentId]) {
                project.songData.instrumentData[this.instrumentId].name = this.name;
            }
        });
        this.partsContainer = this.element.querySelector(".song-part-parts");
        document.addEventListener("mousedown", (e) => {
            if (!this.partsContainer.contains(e.target)) return; // only start interactions if the click is within this instrument's element
            if (e.button === 0) {
                if (e.target === this.partsContainer) { // only start dragging if the container itself is clicked, not an existing part
                    const partElement = e.target;
                    const startX = e.clientX + this.partsScroll.scrollLeft;
                    const initialLeft = partElement.offsetLeft;
                    this.isMouseDown = true;
                    const part = this.addPart("New Part", this.convertPxToBeats(startX - initialLeft), this.convertBeatsToPx(1)); // default duration of 1 beats
                    this.currentElement = part;
                    this.songParts.modified();
                    if (this.isPartValid(part.startTime, part.duration, part)) { // if the new part is overlapping with existing parts, remove it immediately
                        this.parts = this.parts.filter(p => p !== part);
                        this.partsContainer.removeChild(part.element);
                        this.currentElement = null;
                    }
                } else if (e.target.classList.contains("song-part-part")) {
                    this.isDragging = true;
                    this.currentElement = this.parts.find(p => p.element === e.target);
                } else if (e.target.classList.contains("song-part-resize")) {
                    this.isMouseDown = true;
                    const partElement = e.target.parentElement;
                    this.currentElement = this.parts.find(p => p.element === partElement);
                } else if (e.target.classList.contains("song-part-name")) {
                    this.isDragging = true;
                    this.currentElement = this.parts.find(p => p.element === e.target.parentElement);
                }
            }
        });
        this.partsContainer.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            let part;
            if (e.target.classList.contains("song-part-part")) {
                part = this.parts.find(p => p.element === e.target);
                if (part) {
                    this.partsContainer.removeChild(part.element);
                    this.parts = this.parts.filter(p => p !== part);
                }
                this.songParts.modified();
            } else if (e.target.classList.contains("song-part-name")) {
                part = this.parts.find(p => p.element === e.target.parentElement);
                if (part) {
                    this.partsContainer.removeChild(part.element);
                    this.parts = this.parts.filter(p => p !== part);
                }
                this.songParts.modified();
            }
            if (part) {
                const project = this.songParts.app__getProject();
                delete project.songData.instrumentData[this.instrumentId].parts[part.startTime]; // remove the part data from the project
            }
        });
        this.partsContainer = this.element.querySelector(".song-part-parts");
        this.partsScroll.addEventListener("scroll", () => {
            this.songParts.instruments.forEach(instrument => {
                if (instrument !== this) {
                    instrument.partsScroll.scroll({
                        left: this.partsScroll.scrollLeft,
                        behavior: "auto"
                    }); // sync scroll with other instruments
                }
            });
            this.songParts.updatePlayerBar(this.partsScroll.offsetLeft - this.partsScroll.scrollLeft + this.convertBeatsToPx(this.songParts.playPosition)); // update playbar position on scroll
        });
        document.addEventListener("mousemove", (e) => {
            if (this.isMouseDown && this.currentElement) {
                const project = this.songParts.app__getProject();
                const currentPartData = project.songData.instrumentData[this.instrumentId].parts[this.currentElement.startTime];
                const newLeft = this.convertPxToBeats(e.clientX - this.partsScroll.getBoundingClientRect().left + this.partsScroll.scrollLeft);
                if (newLeft <= 0) return; // prevent dragging before the start of the container
                const lastDuration = this.currentElement.duration;
                if (newLeft % this.gridSnapInterval <= this.snapToGridMin && !e.ctrlKey) { // Ctrl key overrides snapping
                    this.currentElement.duration = Math.round(newLeft / this.gridSnapInterval) * this.gridSnapInterval - this.currentElement.startTime;
                } else {
                    this.currentElement.duration = newLeft - this.currentElement.startTime;
                }

                if (this.isPartValid(this.currentElement.startTime, this.currentElement.duration, this.currentElement)) {
                    this.currentElement.duration = lastDuration; // revert to last valid duration if overlapping
                } else {
                    this.currentElement.updatePosition();
                    currentPartData.duration = this.currentElement.duration; // update the part data with the new duration
                }
            } else if (this.isDragging && this.currentElement) {
                const project = this.songParts.app__getProject();
                const currentPartData = project.songData.instrumentData[this.instrumentId].parts[this.currentElement.startTime];

                const newLeft = this.convertPxToBeats(e.clientX - this.partsScroll.getBoundingClientRect().left + this.partsScroll.scrollLeft);
                if (newLeft < 0) return; // prevent dragging before the start of the container or over existing parts
                const lastStartTime = this.currentElement.startTime;
                if (newLeft % this.gridSnapInterval <= this.snapToGridMin && !e.ctrlKey) { // Ctrl key overrides snapping
                    this.currentElement.startTime = Math.round(newLeft / this.gridSnapInterval) * this.gridSnapInterval;
                } else {
                    this.currentElement.startTime = newLeft;
                }


                if (this.isPartValid(newLeft, this.currentElement.duration, this.currentElement)) {
                    this.currentElement.startTime = lastStartTime; // revert to last valid position if overlapping
                } else {
                    this.currentElement.updatePosition();
                    currentPartData.startTime = this.currentElement.startTime; // update the part data with the new start time

                    delete project.songData.instrumentData[this.instrumentId].parts[lastStartTime]; // remove the old part data from the project
                    project.songData.instrumentData[this.instrumentId].parts[this.currentElement.startTime] = currentPartData; // update the part data with the new start time
                    if (this.currentElement.isSelected) {
                        this.songParts.app__setCurrentPart(this.instrumentId, this.currentElement.startTime); // update the current part in the app if the moved part is currently selected
                    }
                }


            }
        });
        document.addEventListener("mouseup", () => {
            if (this.isMouseDown || this.isDragging) {
                this.songParts.modified();
                this.isMouseDown = false;
                this.currentElement = null;
                this.isDragging = false;
            }
        });
        this.channelSpanElement = this.element.querySelector(".song-parts-instrument-channel");
        this.channelSpanElement.addEventListener("click", () => {
            this.channelSpanElement.contentEditable = true;
            this.channelSpanElement.focus();
        });
        this.channelSpanElement.addEventListener("blur", () => {
            this.channelSpanElement.contentEditable = false;
            const newChannel = parseInt(this.channelSpanElement.textContent);
            if (!this.songParts.app__getAudioManager().channels[newChannel] && !isNaN(newChannel) && newChannel >= 0) {
                this.songParts.app__getAudioManager().createChannel("Channel " + newChannel, newChannel);
            }
            if (!isNaN(newChannel) && newChannel >= 0) {
                this.songParts.app__getAudioManager().instruments[this.instrumentId].updateChannel(newChannel);
                this.channelSpanElement.textContent = newChannel;
            } else {
                // 0 always exists, it's "Master"
                this.channelSpanElement.textContent = "0";
                this.songParts.app__getAudioManager().instruments[this.instrumentId].updateChannel(0);
            }
        });
        this.instrumentTypeSelect = this.element.querySelector(".song-parts-instrument-type");
        this.updateInstrumentOptions();
        this.instrumentTypeSelect.addEventListener("change", async (e) => {
            const selectedInstrumentId = e.target.value;
            if (selectedInstrumentId) {
                this.songParts.app__getAudioManager().updateInstrument(this.instrumentId, selectedInstrumentId);
                this.songParts.modified();
            }
        });
        this.partsContainer.querySelector(".song-parts-song-length").style.left = `${this.convertBeatsToPx(this.songParts.songLength)}px`;
        this.partsContainer.style.width = `${this.convertBeatsToPx(this.songParts.songLength)}px`;
    }
    updateInstrumentOptions() {
        const instruments = window.webDaw.globalRegistry.instruments;
        for (const instrumentId in instruments) {
            const option = document.createElement("option");
            option.value = instrumentId;
            option.textContent = window.webDaw.globalRegistry.instruments[instrumentId]?.name || instrumentId;
            this.instrumentTypeSelect.appendChild(option);

            if (instrumentId === window.webDaw.audioManager.instruments[this.instrumentId]?.instrumentId) {
                this.instrumentTypeSelect.value = instrumentId;
            }
        }
    }

    addPart(name, startTime, duration, data = null, dataType = "raw") {
        const project = this.songParts.app__getProject();
        project.songData.instrumentData[this.instrumentId].parts[startTime] = {
            startTime,
            duration,
            name,
            data,
            dataType
        };

        const newPart = new SongPart(name, duration, startTime, this);
        newPart.gen();
        this.parts.push(newPart);
        return newPart;
    }

    save() {
        const instrument = this.songParts.app__getAudioManager().instruments[this.instrumentId] || null;

        return {
            name: this.name,
            instrument: {
                id: instrument?.instrumentId || null,
                channel: instrument?.currentChannel || null,
                presets: instrument?.saveParameters() || null
            },
            parts: this.parts.map(part => ({
                name: part.name,
                startTime: part.startTime,
                duration: part.duration,
                data: this.songParts.app__getProject().songData.instrumentData[this.instrumentId].parts[part.startTime].data || null,
                dataType: this.songParts.app__getProject().songData.instrumentData[this.instrumentId].parts[part.startTime].dataType || null
            }))
        };
    }
}

export class SongParts extends ViewTemplate {
    HTML_TEMPLATE = `
    <div class="song-part-playerbar"></div>
    <ul>
        <li>
            <h2> Song Parts</h2>
            <hr>
        </li>
        <li class="song-parts-instrument">
            <button class="song-parts-add-instrument">+</button>
        </li>
    </ul>
    <h3>Instrument Settings</h3>
    <div class="song-parts-instrument-gui">Double click an instrument's name to load their settings</div>
                    `;
    INSTRUMENT_TEMPLATE = `
                    <li class="song-parts-instrument">
                        <h2 class="song-parts-header"><span class="song-parts-instrument-channel">0</span><input type="text"
                            class="song-parts-instrument-name no-global-style" readonly value="Piano"><select class="song-parts-instrument-type"></select><span
                                class="song-parts-instrument-edit">🖉</span><span
                                class="song-parts-instrument-remove">🗑️</span></h2>
                            <div class="song-part-parts-container">
                                <ul class="song-part-parts">
                                    <li class="song-parts-song-length"></li>
                                </ul>
                            </div>
                        </li>`;
    DEFAULT_INSTRUMENT_ID = "none-25036";

    constructor() {
        super();
        this.addPartBtn = null;
        this.instrumentsContainer = null;
        this.bpm = 120;
        this.songLength = 20; // In beats
        this.instruments = [];
        this.undoBuffer = [[]];
        this.instrumentGuiContainer = null;
        this.undoIndex = 0;
        this.lastRedoUndo = 0;
        this.maxUndoBuffer = 100;
        this.openedUIInstrument = null;
        this.isPlaying = false;
        this.playPosition = 0;
        this.undoRedoSpaceWarning = 1000; // To avoid performance issues, we show a warning if the user tries to spam undo/redo
        const songData = window.webDaw.project.songData;
        if (songData) {
            this.bpm = songData.tempo || this.bpm;
            this.songLength = songData.songLength || this.songLength;
        }
        this.updatePlayerbarInerval = null;
        this.playbackStartedEvent = null;
        this.isDraggingPlaybar = false;
        this.playbackStoppedEvent = null;
        this.playbarHasBeenInit = false;
    }

    openGUI(instrument) {
        if (this.openedUIInstrument) {
            this.openedUIInstrument.element.classList.remove("song-parts-instrument-selected");
            this.instrumentGuiContainer.innerHTML = "";
            window.webDaw.audioManager.instruments[this.openedUIInstrument.instrumentId].tearUIDown();
        }
        instrument.element.classList.add("song-parts-instrument-selected");
        this.openedUIInstrument = instrument;
        const instrumentInstance = window.webDaw.audioManager.instruments[instrument.instrumentId];
        this.instrumentGuiContainer.innerHTML = ""; // Clear previous GUI
        instrumentInstance.genHtml(this.instrumentGuiContainer);
        instrumentInstance.registerEvents();
    }

    genHtml(container) {
        container.classList.add("song-parts-instrument-container");
        container.innerHTML = this.HTML_TEMPLATE;
        this.addPartBtn = container.querySelector(".song-parts-add-instrument");
        this.instrumentsContainer = container.querySelector("ul");
        this.instrumentGuiContainer = container.querySelector(".song-parts-instrument-gui");
        this.playbar = container.querySelector(".song-part-playerbar");
    }

    updatePlayerBar(x) {
        this.playbar.style.top = `${this.instruments[0].partsScroll.offsetTop}px`;
        this.playbar.style.height = `${this.instruments[0].element.offsetHeight * this.instruments.length}px`;
        if (x > this.instruments[0].partsScroll.offsetLeft) {
            this.playbar.style.left = `${x}px`;
        } else {
            this.playbar.style.left = `${this.instruments[0].partsScroll.offsetLeft}px`;
        }
    }

    registerEvents() {
        this.playbackStartedEvent = window.webDaw.eventSystem.registerEventListener("playbackStarted", () => {
            this.updatePlayerbarInerval = setInterval(() => {
                const currentTime = window.webDaw.audioManager.currentBeat;
                if (this.instruments[0]) {
                    const x = this.instruments[0].partsScroll.offsetLeft - this.instruments[0].partsScroll.scrollLeft + this.instruments[0].convertBeatsToPx(currentTime);
                    this.playPosition = currentTime;
                    this.updatePlayerBar(x);
                }
            }, 50);
        });
        this.playbackStoppedEvent = window.webDaw.eventSystem.registerEventListener("playbackStopped", () => {
            if (this.updatePlayerbarInerval) {
                clearInterval(this.updatePlayerbarInerval);
            }
            this.playPosition = 0;
            if (this.instruments[0]) {
                const x = this.instruments[0].partsScroll.offsetLeft - this.instruments[0].partsScroll.scrollLeft + this.instruments[0].convertBeatsToPx(this.playPosition);
                this.updatePlayerBar(x);
            }
        });
        this.addPartBtn.addEventListener("click", () => {
            this.addInstrument("New Instrument");
            this.modified();
        });
        this.playbar.addEventListener("mousedown", () => {
            this.isDraggingPlaybar = true;
            window.webDaw.audioManager.pauseSong();
        });
        document.addEventListener("mousemove", (e) => {
            if (this.isDraggingPlaybar) {
                const newPlayPosition = this.instruments[0].convertPxToBeats(e.clientX - this.instruments[0].partsScroll.offsetLeft + this.instruments[0].partsScroll.scrollLeft);

                if (newPlayPosition >= 0 && newPlayPosition <= this.songLength) {
                    this.playPosition = newPlayPosition;

                    this.updatePlayerBar(e.clientX);
                }
            }
        });
        document.addEventListener("mouseup", () => {
            if (this.isDraggingPlaybar) {
                this.isDraggingPlaybar = false;
            }
        });
        document.addEventListener("keydown", (e) => {
            if (this.app__isFocused() && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") { // prevent interfering with typing
                if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
                    this.undo();
                } else if (e.key === "y" && (e.ctrlKey || e.metaKey)) {
                    this.redo();
                } else if (e.key === " ") {
                    if (this.isPlaying) {
                        window.webDaw.audioManager.pauseSong();
                    } else {
                        window.webDaw.audioManager.playSong(this.playPosition);
                    }
                    this.isPlaying = !this.isPlaying;
                }
            }
        });
        const project = window.webDaw.project;
        if (project.songData.instrumentData) {
            const datas = this.generateLoadData();
            this.load(datas, true);
        }
        document.addEventListener("keydown", () => {
            if (this.app__isFocused()) {
            }
        });
    }

    /**
     * THIS SHOULD BE CALLED ONLY WHEN IT'S A USER-TRIGGERED CHANGE, NOT WHEN LOADING A PROJECT OR UNDOING/REDOING, ...
     */
    async addInstrument(name, instrumentId = this.DEFAULT_INSTRUMENT_ID, channel = 0, presets = null, preDefinedId = null) {
        let id;
        if (!preDefinedId) {
            id = await this.app__getAudioManager().loadInstrument(instrumentId, channel, name);
        } else {
            id = preDefinedId; // Load the instrument with the predefined id
        }
        const newInstrument = new Instrument(name, id, this);
        newInstrument.songParts = this;
        if (presets) {
            window.webDaw.audioManager.instruments[id].loadParameters(presets);
        }
        newInstrument.gen();
        this.instruments.push(newInstrument);
        if (!this.playbarHasBeenInit) {
            this.updatePlayerBar(this.instruments[0].partsScroll.offsetLeft);
            this.playbarHasBeenInit = true;
        }
        return newInstrument;
    }

    save() {
        const saveData = {
            instruments: this.instruments.map(instrument => instrument.save())
        };
        return saveData;
    }

    generateLoadData() {
        const project = window.webDaw.project;

        const instruments = [];
        for (const instrumentId in project.songData.instrumentData) {
            const instrumentData = project.songData.instrumentData[instrumentId];
            const parts = Object.values(instrumentData.parts);

            instruments.push({
                name: instrumentData.name,
                instrumentId: instrumentId, // The instrument saving / loading is managed by the AudioManager itself, so we just need to give it an id to load it with the correct settings
                parts
            });
        }
        const loadData = {
            instruments
        }

        return loadData;
    }


    async load(data, noCreation = false) {
        this.instruments.forEach(instrument => instrument.remove(false));
        if (data.instruments) {
            for (const instrumentData of data.instruments) {
                let instrument;
                if (noCreation) {
                    instrument = await this.addInstrument(instrumentData.name, null, null, null, instrumentData.instrumentId);

                } else {
                    instrument = await this.addInstrument(instrumentData.name, instrumentData.instrumentId, instrumentData.channel, instrumentData.presets);
                }
                instrumentData.parts.forEach(partData => {
                    instrument.addPart(partData.name, partData.startTime, partData.duration, partData.data ?? null, partData.dataType ?? "raw");
                });
            };
        }
    }

    undo() {
        if (Date.now() - this.lastRedoUndo < this.undoRedoSpaceWarning) {
            window.error(false, "Please wait before spamming undo/redo to avoid performance issues.");
            return;
        }
        if (this.undoIndex > 0) {
            this.undoIndex--;
            const previousState = this.undoBuffer[this.undoIndex];
            this.load(previousState);
        }
    }

    redo() {
        if (Date.now() - this.lastRedoUndo < this.undoRedoSpaceWarning) {
            window.error(false, "Please wait before spamming undo/redo to avoid performance issues.");
            return;
        }
        if (this.undoIndex < this.undoBuffer.length - 1) {
            this.undoIndex++;
            const nextState = this.undoBuffer[this.undoIndex];
            this.load(nextState);
        }
    }

    modified() {
        this.undoBuffer = this.undoBuffer.slice(0, this.undoIndex + 1); // discard any redo history if we modify after undoing
        this.undoBuffer.push(this.save());
        if (this.undoBuffer.length > this.maxUndoBuffer) {
            this.undoBuffer.shift();
        } else {
            this.undoIndex++;
        }
    }

    tearDown() {
        if (this.playbackStartedEvent) {
            window.webDaw.eventSystem.unregisterEventListener("playbackStarted", this.playbackStartedEvent);
        }
        if (this.playbackStoppedEvent) {
            window.webDaw.eventSystem.unregisterEventListener("playbackStopped", this.playbackStoppedEvent);
        }
    }
}