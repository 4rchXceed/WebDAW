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
        this.pixelsPerBeat = 1;
        this.isMouseDown = false;
        this.currentElement = null;
        this.isDragging = false;
        this.gridSnapInterval = 50;
        this.snapToGridMin = 10;
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

    isPartOverlapping(startTime, duration, excludePart = null) {
        return this.parts.some(p => p !== excludePart && !(p.startTime + p.duration <= startTime || p.startTime >= startTime + duration));
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
        this.partsContainer.addEventListener("mousedown", (e) => {
            if (e.button === 0) {
                if (e.target === this.partsContainer) { // only start dragging if the container itself is clicked, not an existing part
                    const partElement = e.target;
                    const startX = e.clientX;
                    const initialLeft = partElement.offsetLeft;
                    this.isMouseDown = true;
                    const part = this.addPart("New Part", this.convertPxToBeats(startX - initialLeft), 40); // default duration of 4 beats
                    this.currentElement = part;
                    this.songParts.modified();
                    if (this.isPartOverlapping(part.startTime, part.duration, part)) { // if the new part is overlapping with existing parts, remove it immediately
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
        this.partsContainer.addEventListener("scroll", () => {
            this.partsContainer.style.setProperty("--song-parts-scroll", `${-this.partsContainer.scrollLeft}px`); // for the scrollbar shadow effect
        });
        document.addEventListener("mousemove", (e) => {
            if (this.isMouseDown && this.currentElement) {
                const project = this.songParts.app__getProject();
                const currentPartData = project.songData.instrumentData[this.instrumentId].parts[this.currentElement.startTime];
                const newLeft = this.convertPxToBeats(e.clientX - this.partsContainer.getBoundingClientRect().left + this.partsContainer.scrollLeft);
                if (newLeft <= 0) return; // prevent dragging before the start of the container
                const lastDuration = this.currentElement.duration;
                if (newLeft % this.gridSnapInterval <= this.snapToGridMin && !e.ctrlKey) { // Ctrl key overrides snapping
                    this.currentElement.duration = Math.round(newLeft / this.gridSnapInterval) * this.gridSnapInterval - this.currentElement.startTime;
                } else {
                    this.currentElement.duration = newLeft - this.currentElement.startTime;
                }

                if (this.isPartOverlapping(this.currentElement.startTime, this.currentElement.duration, this.currentElement)) {
                    this.currentElement.duration = lastDuration; // revert to last valid duration if overlapping
                } else {
                    this.currentElement.updatePosition();
                }
                currentPartData.duration = this.currentElement.duration; // update the part data with the new duration
            } else if (this.isDragging && this.currentElement) {
                const project = this.songParts.app__getProject();
                const currentPartData = project.songData.instrumentData[this.instrumentId].parts[this.currentElement.startTime];

                const newLeft = this.convertPxToBeats(e.clientX - this.partsContainer.getBoundingClientRect().left + this.partsContainer.scrollLeft);
                if (newLeft < 0) return; // prevent dragging before the start of the container or over existing parts
                const lastStartTime = this.currentElement.startTime;
                if (newLeft % this.gridSnapInterval <= this.snapToGridMin && !e.ctrlKey) { // Ctrl key overrides snapping
                    this.currentElement.startTime = Math.round(newLeft / this.gridSnapInterval) * this.gridSnapInterval;
                } else {
                    this.currentElement.startTime = newLeft;
                }

                if (this.isPartOverlapping(newLeft, this.currentElement.duration, this.currentElement)) {
                    this.currentElement.startTime = lastStartTime; // revert to last valid position if overlapping
                } else {
                    this.currentElement.updatePosition();
                }
                delete project.songData.instrumentData[this.instrumentId].parts[lastStartTime]; // remove the old part data from the project
                project.songData.instrumentData[this.instrumentId].parts[this.currentElement.startTime] = currentPartData; // update the part data with the new start time
                if (this.currentElement.isSelected) {
                    this.songParts.app__setCurrentPart(this.instrumentId, this.currentElement.startTime); // update the current part in the app if the moved part is currently selected
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

    addPart(name, startTime, duration) {
        const project = this.songParts.app__getProject();
        project.songData.instrumentData[this.instrumentId].parts[startTime] = {
            startTime,
            duration,
            name,
            data: {}
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
                duration: part.duration
            }))
        };
    }
}

export class SongParts extends ViewTemplate {
    HTML_TEMPLATE = `
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
                            <ul class="song-part-parts"></ul>
                        </li>`;
    DEFAULT_INSTRUMENT_ID = "none-25036";

    constructor() {
        super();
        this.addPartBtn = null;
        this.instrumentsContainer = null;
        this.bpm = 120; // TODO: get this from the song data
        this.instruments = [];
        this.undoBuffer = [[]];
        this.instrumentGuiContainer = null;
        this.undoIndex = 0;
        this.lastRedoUndo = 0;
        this.maxUndoBuffer = 100;
        this.openedUIInstrument = null;
        this.undoRedoSpaceWarning = 1000; // To avoid performance issues, we show a warning if the user tries to spam undo/redo
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
    }

    registerEvents() {
        this.addPartBtn.addEventListener("click", (e) => {
            this.addInstrument("New Instrument");
            this.modified();
        });
        document.addEventListener("keydown", (e) => {
            if (this.app__isFocused()) {
                if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
                    this.undo();
                } else if (e.key === "y" && (e.ctrlKey || e.metaKey)) {
                    this.redo();
                }
            }
        });
    }

    /**
     * THIS SHOULD BE CALLED ONLY WHEN IT'S A USER-TRIGGERED CHANGE, NOT WHEN LOADING A PROJECT OR UNDOING/REDOING, ...
     */
    async addInstrument(name, instrumentId = this.DEFAULT_INSTRUMENT_ID, channel = 0, presets = null) {
        const id = await this.app__getAudioManager().loadInstrument(instrumentId, channel, name);
        const newInstrument = new Instrument(name, id, this);
        newInstrument.songParts = this;
        if (presets) {
            window.webDaw.audioManager.instruments[id].loadParameters(presets);
        }
        newInstrument.gen();
        this.instruments.push(newInstrument);
        return newInstrument;
    }

    save() {
        const saveData = {
            instruments: this.instruments.map(instrument => instrument.save())
        };
        return saveData;
    }

    async load(data) {
        this.instruments.forEach(instrument => instrument.remove(false));
        if (data.instruments) {
            for (const instrumentData of data.instruments) {
                const instrument = await this.addInstrument(instrumentData.name, instrumentData.instrument.id, instrumentData.instrument.channel, instrumentData.instrument.presets);
                instrumentData.parts.forEach(partData => {
                    instrument.addPart(partData.name, partData.startTime, partData.duration);
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
}