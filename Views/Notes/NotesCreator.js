import { ViewTemplate } from "../Template/ViewTemplate.js";

class Note {
    PREVIEW_NOTE_DURATION = 300; // ms
    constructor(time, note, duration, velocity, notesCreator) {
        this.time = time;
        this.note = note;
        this.duration = duration;
        this.velocity = velocity;
        this.notesCreator = notesCreator;
        this.htmlElement = null;
        this.hasBeenPlayed = false;
        this.velocitySlider = null;
        this.hasEnded = false;
    }

    placeNote() {
        let x = this.notesCreator.currentBarWidth * (this.time - this.notesCreator.PIANO_NOTE_WIDTH / this.notesCreator.BAR_WIDTH); // We need to offset the note to the left because of the piano note area
        const noteElement = document.createElement("div");
        noteElement.classList.add("view-note-note-canvas");
        noteElement.style.top = `${this.notesCreator.notesBgLines[this.note].offsetTop}px`;
        noteElement.style.left = `${x}px`;
        noteElement.style.width = `${this.duration * this.notesCreator.currentBarWidth}px`;
        this.htmlElement = noteElement;
        const noteAddLengthElement = document.createElement("div");
        noteAddLengthElement.classList.add("view-note-note-add-length");
        noteAddLengthElement.onmousedown = (e) => {
            e.stopPropagation(); // Prevent triggering the note placement/move when trying to extend the note
            if (e.button === 0) {
                if (this.notesCreator.selectedNotes.length > 0) {
                    return;
                }
                this.notesCreator.isMouseDown = true;
                this.notesCreator.mouseDownElement = this;
            }
        }
        noteElement.appendChild(noteAddLengthElement);
        this.velocitySlider = document.createElement("input");
        this.velocitySlider.type = "range";
        this.velocitySlider.min = "0";
        this.velocitySlider.max = "127";
        this.velocitySlider.value = this.velocity;
        this.velocitySlider.classList.add("view-note-velocity-slider");
        this.velocitySlider.oninput = (e) => {
            e.stopPropagation(); // Prevent triggering the note placement/move when trying to change the velocity
            if (this.notesCreator.selectedNotes.length > 0) {
                for (const note of this.notesCreator.selectedNotes) {
                    note.velocity = parseInt(e.target.value);
                    note.velocitySlider.value = e.target.value;
                }
            }
            this.velocity = parseInt(e.target.value);
        }
        noteElement.appendChild(this.velocitySlider);
        this.notesCreator.notesCanvas.appendChild(noteElement);
        this.playPreview();
    }

    playPreview() {
        // this.notesCreator.app__getSharedPool("global/audio/vstWeb")?.playNote(this.notesCreator.convertNoteToMidiNoteNumber(this.note), this.velocity, this.PREVIEW_NOTE_DURATION);
        const instrument = this.notesCreator.app__getSelectedPartData()[1].instrumentId;
        this.notesCreator.app__getAudioManager().play(instrument, {
            type: "note",
            internalType: "play",
            note: this.notesCreator.convertNoteToMidiNoteNumber(this.note),
            velocity: this.velocity,
            duration: this.PREVIEW_NOTE_DURATION,
        })
    }

    updateNote() {
        const widthPerBeat = this.notesCreator.currentBarWidth;

        let x = widthPerBeat * (this.time - this.notesCreator.PIANO_NOTE_WIDTH / this.notesCreator.BAR_WIDTH); // TAKE THE DEFAULT ONE, BECAUSE THE PIANO_NOTE doesn't change when zooming

        this.htmlElement.style.top = `${this.notesCreator.notesBgLines[this.note].offsetTop}px`;
        this.htmlElement.style.left = `${x}px`;
        this.htmlElement.style.width = `${this.duration * widthPerBeat}px`;
    }

    remove() {
        if (this.htmlElement) {
            this.htmlElement.remove();
        }
        this.notesCreator.notes = this.notesCreator.notes.filter(n => n !== this);
    }

    checkPlay(currentBeat) {
        if (this.time <= currentBeat && !this.hasBeenPlayed) { // Play "X seconds before"
            this.hasBeenPlayed = true;
            setTimeout(() => {
                this.htmlElement.style.animation = `notePlay ${this.notesCreator.convertBeatToMs(this.duration)}ms ease-out`;
            }, this.notesCreator.app__getSharedPool("global/audio/vstWeb").getBufferTime() * 1000); // We need to delay the animation to sync it with the sound, otherwise it'll be off because of the audio buffer time
            return true;
        }
        return false;
    }

    checkEnd(currentBeat) {
        if (currentBeat >= this.time + this.duration && this.hasBeenPlayed && !this.hasEnded) {
            this.hasEnded = true;
            return true;
        }
        return false;
    }

    resetPlay() {
        this.htmlElement.style.animation = "";
        this.hasBeenPlayed = false;
        this.hasEnded = false;
    }
}

/**
 * The main class responsible for creating and managing the note editor interface, handling user interactions, and generating the notes.txt output.
 */
export class NotesCreator extends ViewTemplate {
    NOTE_NAMES = { "B": 0, "A#": 1, "A": 0, "G#": 1, "G": 0, "F#": 1, "F": 0, "E": 0, "D#": 1, "D": 0, "C#": 1, "C": 0 };
    PIANO_NOTE_WIDTH = 100;
    BAR_WIDTH = 20;
    NOTE_LINE_HEIGHT = 20;
    MAX_ACTION_BUFFER = 500; // Max number of actions to keep in the undo buffer ! WILL BE ADJUSTABLE IN THE SETTINGS, FOR NOW IT'S JUST A DEFAULT VALUE


    /**
     * Initializes the NotesCreator with default settings and empty state.
     */
    constructor() {
        super();
        this.VIEW_NAME = "NotesCreator";
        this.maxActionBuffer = this.MAX_ACTION_BUFFER;
        this.actionBuffer = [[]]; // Empty action buffer with an initial state
        this.actionBufferPointer = 0;
        this.noteLineHeight = this.NOTE_LINE_HEIGHT;
        this.currentBarWidth = this.BAR_WIDTH;
        this.songLength = 16; // in bars
        this.timeSig = 4; // beats per bar
        this.notesBgLines = [];
        this.notes = [];
        this.isMouseDown = false;
        this.mouseDownElement = null;
        this.currentPlayPosition = 0;
        this.defaultVel = 100;
        this.bpm = 110;
        this.playInterval = null;
        this.isPlaying = false;
        this.currentZoomX = 100;
        this.currentZoomY = 100;
        this.isSelecting = false;
        this.startSelection = [0, 0];
        this.selectedNotes = [];
        this.isMovingNotes = false;
        this.movingNote = null; // If there's a selection, we will use this.selectedNotes instead
        this.copyBuffer = []; // Buffer to store copied notes for copy/paste functionality
    }

    getSelectedNotes() {
        if (!this.isSelecting) return [];
        const rect = this.selectionElement.getBoundingClientRect();
        const containerRect = this.canvasElement.getBoundingClientRect();
        const x1 = rect.left - containerRect.left + this.canvasElement.scrollLeft;
        const y1 = rect.top - containerRect.top;
        const x2 = x1 + rect.width;
        const y2 = y1 + rect.height;

        return this.notes.filter(note => {
            const noteX1 = note.time * this.currentBarWidth;
            const noteY1 = this.notesBgLines[note.note].offsetTop;
            const noteX2 = noteX1 + (note.duration * this.currentBarWidth);
            const noteY2 = noteY1 + this.notesBgLines[note.note].offsetHeight;

            return !(noteX2 < x1 || noteX1 > x2 || noteY2 < y1 || noteY1 > y2);
        });
    }

    /**
     * Convert X beats to milliseconds based on the current BPM.
     * @param {number} beat 
     * @returns {number} milliseconds
     */
    convertBeatToMs(beat) {
        const beatsPerSecond = this.bpm / 60;
        return Math.round((beat / beatsPerSecond) * 1000);
    }

    /**
     * Get a note that exists at a specific time and note index.
     * @param {number} time 
     * @param {number} note 
     * @returns {Note|null}
     */
    getNoteByTimeAndNote(time, note) {
        return this.notes.find(n => n.time <= time && n.time + n.duration > time && n.note === note);
    }

    /**
     * Get all notes that are active at a specific beat. (used for playback)
     * @param {number} beat beat to check
     * @returns {Note[]}
     */
    getNotesAtBeat(beat) {
        return this.notes.filter(n => n.time <= beat && (n.time + 1) > beat); // Exact match
    }

    static canBeOpened() {
        return window.webDaw.currentPart.partId !== null; // Ensure that a part is selected before allowing to open the NotesCreator
    }

    /**
     * Generate the HTML structure for the note editor interface and append it to the provided container element.
     * @param {HTMLElement} container 
     */
    genHtml(container) {
        /*
        <button id="copy-notes-txt">Copy notes.txt</button>
        <div class="player-bar"></div>
        <div class="vert-notes">
        </div>
        <div class="notes-canvas-bg"></div>
        <div class="notes-canvas"></div>
        */
        this.container = container;
        this.container.classList.add("view-note-container");
        // this.copyBtn = document.createElement("button");
        // this.copyBtn.id = "view-note-copy-notes-txt";
        // this.copyBtn.textContent = "Copy notes.txt";
        // this.copyBtn.style.display = "none";
        // this.container.appendChild(this.copyBtn);

        this.vertNotes = document.createElement("div");
        this.vertNotes.classList.add("view-note-vert-notes");

        this.canvasElement = document.createElement("div");
        this.canvasElement.appendChild(this.vertNotes);
        this.canvasElement.classList.add("view-note-canvas-element");
        this.container.appendChild(this.canvasElement);

        this.playerBar = document.createElement("div");
        this.playerBar.classList.add("view-note-player-bar");
        this.canvasElement.appendChild(this.playerBar);

        this.notesCanvasBg = document.createElement("div");
        this.notesCanvasBg.classList.add("view-note-notes-canvas-bg");
        this.canvasElement.appendChild(this.notesCanvasBg);

        this.notesCanvasContainer = document.createElement("div");
        this.notesCanvasContainer.classList.add("view-note-notes-canvas");
        this.canvasElement.appendChild(this.notesCanvasContainer);
        this.notesCanvas = document.createElement("div");
        this.notesCanvasContainer.appendChild(this.notesCanvas);

        this.selectionElement = document.createElement("div");
        this.selectionElement.classList.add("view-note-selection");
        this.canvasElement.appendChild(this.selectionElement);

        this.settingsPanel = document.createElement("div");
        this.settingsPanel.classList.add("view-note-settings-panel");
        this.settingsPanel.innerHTML = `
        <h2>Settings</h2>
        <div style="display: flex;">
            <label for="view-note-setting-max-action-buffer">Max Undo Buffer Size: </label>
            <input type="number" id="view-note-setting-max-action-buffer" value="${this.MAX_ACTION_BUFFER}" min="1" max="10000">
        </div>
        <div style="display: flex;">
            <label for="view-note-setting-song-bpm">Song BPM: </label>
            <input type="number" id="view-note-setting-song-bpm" value="${this.bpm}" min="1" max="300">
        </div>
        `;
        this.maxActionBufferInput = this.settingsPanel.querySelector("#view-note-setting-max-action-buffer");
        this.bpmInput = this.settingsPanel.querySelector("#view-note-setting-song-bpm");
        this.container.appendChild(this.settingsPanel);

        this.settingsPanelOpenBtn = document.createElement("button");
        this.settingsPanelOpenBtn.classList.add("view-note-settings-panel-open-btn");
        this.settingsPanelOpenBtn.textContent = "Settings";
        this.container.appendChild(this.settingsPanelOpenBtn);
        let partData = this.app__getSelectedPartData();
        if (partData) {
            if (!partData[0].data.map) { // Hasn't been initialized yet, so we initialize it. By default a partData is just an empty object
                partData[0].data = [];
            }
            this.songLength = Math.round(partData[0].duration / this.timeSig); // Convert length in beats to length in bars, we round it, to avoid having a weird number of bars
            this.loadFromArray(partData[0].data);
        } else {
            window.error(false, "NotesCreator: No part data found for the selected part. Make sure to select a part before opening the NotesCreator view.")
        }
    }

    /**
     * Generate the note lines and beat lines based on the song length and note range, and append them to the appropriate containers.
     * (Generates a grid-like structure where users can place notes, with vertical lines for beats and bars, and horizontal lines for different notes)
     */
    genNotes() {
        this.settingsPanelOpenBtn.addEventListener("click", () => {
            if (this.settingsPanel.style.display === "block") {
                this.settingsPanel.style.display = "none";
            } else {
                this.settingsPanel.style.display = "block";
            }
        });
        this.maxActionBufferInput.addEventListener("change", (e) => {
            const value = parseInt(e.target.value);
            this.maxActionBuffer = value;
        });
        this.bpmInput.addEventListener("change", (e) => {
            const value = parseInt(e.target.value);
            this.bpm = value;
        });
        this.vertNotes.innerHTML = "";
        for (let i = 7; i >= 2; i--) {
            for (const [note, isBlack] of Object.entries(this.NOTE_NAMES)) {
                const noteElement = document.createElement("div");
                noteElement.classList.add("view-note-note");
                if (isBlack) {
                    noteElement.classList.add("view-note-black");
                } else {
                    noteElement.classList.add("view-note-white");
                }
                noteElement.textContent = `${note}${i}`;
                this.vertNotes.appendChild(noteElement);

                const noteCanvasElement = document.createElement("div");
                noteCanvasElement.classList.add("view-note-note-bg-canvas");
                if (isBlack) {
                    noteCanvasElement.classList.add("view-note-notebg-black");
                } else {
                    noteCanvasElement.classList.add("view-note-notebg-white");
                }
                // for (let j = 0; j < this.songLength * this.timeSig; j++) {
                //     const beatLine = document.createElement("div");
                //     beatLine.classList.add("view-note-beat-line");
                //     if (j % 4 === 0) {
                //         beatLine.classList.add("view-note-bar-line");
                //     }
                //     noteCanvasElement.appendChild(beatLine);
                // }
                this.notesBgLines.push(noteCanvasElement);
                this.notesCanvasBg.appendChild(noteCanvasElement);
            }
        }
    }

    /**
     * Generated VstWeb's notes.txt format based on the current notes in the editor. (View: https://github.com/4rchXceed/VstWeb?tab=readme-ov-file#specification-for-the-text-file)
     * @returns {string} notes.txt
     */
    generateNotesTxt() {
        let notesTxt = "";

        const events = [];

        for (const note of this.notes) {
            const midi = this.convertNoteToMidiNoteNumber(note.note);

            events.push({
                time: note.time,
                type: "on",
                midi
            });

            events.push({
                time: note.time + note.duration,
                type: "off",
                midi
            });
        }

        events.sort((a, b) => {
            if (a.time !== b.time) return a.time - b.time;
            if (a.type === b.type) return 0;
            return a.type === "off" ? -1 : 1;
        });

        let currentTime = 0;

        for (const event of events) {
            const delta = event.time - currentTime;

            if (delta > 0) {
                notesTxt += `!:${this.convertBeatToMs(delta)}\n`;
                currentTime = event.time;
            }

            notesTxt += `${event.midi}:${event.type === "on" ? "1100" : "0000"}\n`;
        }

        return notesTxt;
    }

    /**
     * Converts a note index (0-48) to a MIDI note number (21-95).
     * @param {number} noteIndex 
     * @returns {number} MIDI note number
     */
    convertNoteToMidiNoteNumber(noteIndex) {
        const TOP_MIDI = 95; // B7
        return TOP_MIDI - noteIndex;
    }

    /**
     * Checks if a note can be placed at the specified time and note index without overlapping with existing notes.
     * @param {Note} note 
     * @returns {boolean} whether the note is unique (i.e., doesn't overlap with any existing note)
     */
    isNoteUnique(note) {
        return !this.notes.some(n => n.note === note.note && n.time < note.time + note.duration && n.time + n.duration > note.time);
    }

    /**
     * Convert absolute (but relative to the container of the html elements) x,y coordinates from a mouse event to the corresponding note index and beat index in the editor grid.
     * @param {number} x 
     * @param {number} y 
     * @returns {Object} note index and beat index
     */
    absoluteCoordsToNote(x, y) {
        const noteIndex = Math.floor(y / this.notesBgLines[0].offsetHeight);

        // const width = this.notesBgLines[noteIndex].offsetWidth;
        const beatIndex = Math.floor(x / this.currentBarWidth) + Math.round(this.PIANO_NOTE_WIDTH / this.BAR_WIDTH);
        return { note: noteIndex, beat: beatIndex };
    }

    /**
     * Register event listeners for mouse and keyboard interactions to allow users to place, modify, and remove notes, as well as control playback and save/load functionality.
     */
    registerEvents() {
        this.genNotes();
        document.addEventListener("mousedown", (e) => {
            if (!this.container.contains(e.target)) {
                return; // Ignore clicks outside of the container
            }
            if (e.target.classList.contains("view-note-velocity-slider") || this.settingsPanel.style.display === "block" || e.target === this.settingsPanelOpenBtn) {
                return; // Ignore clicks on velocity sliders, they have their own event listener
            } else {
                this.notes.forEach(n => n.velocitySlider.style.display = "none"); // Hide all velocity sliders when clicking anywhere, except on the sliders themself
            }
            const rect = this.canvasElement.getBoundingClientRect();
            if (e.clientX - rect.left < this.PIANO_NOTE_WIDTH) {
                return; // Ignore clicks on the vertical notes area
            }
            if (e.button === 1) {
                e.preventDefault(); // Prevent the "scroll-with-mousemove"
            }
            if (e.button === 0 || e.button === 1 || e.ctrlKey || e.button === 2 || e.altKey) { // Only respond to left-click and (wheel-click or ctrl+click)
                const rect = this.canvasElement.getBoundingClientRect();
                const x = e.clientX - rect.left + this.canvasElement.scrollLeft - this.PIANO_NOTE_WIDTH;
                const y = e.clientY - rect.top;
                if (!e.ctrlKey) {
                    const { note, beat } = this.absoluteCoordsToNote(x, y);
                    if (note < 0 || note >= this.notesBgLines.length || beat < 0 || beat >= this.songLength * this.timeSig + Math.round(this.PIANO_NOTE_WIDTH / this.BAR_WIDTH)) {
                        return; // Clicked outside of valid note area
                    }
                    if (e.button === 0) {
                        const noteObj = new Note(beat, note, 1, this.defaultVel, this);
                        if (this.isNoteUnique(noteObj)) {
                            this.selectedNotes.forEach(n => n.htmlElement.classList.remove("view-note-note-selected"));
                            this.selectedNotes = []; // Reset when normal click
                            this.notes.push(noteObj);
                            this.isMouseDown = true;
                            this.mouseDownElement = noteObj;
                            noteObj.placeNote();
                        } else {
                            const existingNote = this.getNoteByTimeAndNote(beat, note);
                            if (existingNote) {
                                this.isMovingNotes = true;
                                this.movingNote = existingNote;
                                existingNote.velocitySlider.style.display = "block"; // Show velocity slider when moving the note
                            }
                        }
                    } else if (e.altKey || (e.button === 1)) { // Alt + Left click or Middle click
                        this.currentPlayPosition = beat; // Move play position to clicked beat
                        this.stop();
                    }
                } else if (e.ctrlKey && e.button === 2) { // Ctrl + Right click
                    if (!e.shiftKey) {
                        this.selectedNotes.forEach(n => n.htmlElement.classList.remove("view-note-note-selected"));
                        this.selectedNotes = [];
                    }
                    this.selectionElement.style.left = `${x + this.PIANO_NOTE_WIDTH}px`;
                    this.selectionElement.style.top = `${y}px`;
                    this.selectionElement.style.display = "block";
                    this.isSelecting = true;
                    this.startSelection = [x + this.PIANO_NOTE_WIDTH, y];
                    const width = x - this.startSelection[0];
                    const height = y - this.startSelection[1];
                    this.selectionElement.style.width = `${Math.abs(width)}px`;
                    this.selectionElement.style.height = `${Math.abs(height)}px`;
                    this.modified();
                }
            }
        });
        this.container.addEventListener("scroll", (e) => { // Bad but itŝ the best way I found, without doing tricky css
            this.vertNotes.style.transform = `translateX(${e.target.scrollLeft}px)`; // Sync the vertical notes with the canvas scroll
        });
        document.addEventListener("mousemove", (e) => {
            // We don't want to have only mousemove inside the container, as the user might want to move the mouse outside of it while placing a note or selecting
            let note, beat;
            if ((this.isMouseDown && this.mouseDownElement) || (this.isMovingNotes && this.movingNote)) {
                const rect = this.canvasElement.getBoundingClientRect();
                const x = e.clientX - rect.left + this.canvasElement.scrollLeft - this.PIANO_NOTE_WIDTH;
                const y = e.clientY - rect.top;
                ({ note, beat } = this.absoluteCoordsToNote(x, y));
            }
            if (this.isMouseDown && this.mouseDownElement) {
                if (beat <= this.songLength * this.timeSig + Math.round(this.PIANO_NOTE_WIDTH / this.currentBarWidth)) {
                    this.mouseDownElement.duration = Math.max(1, beat - this.mouseDownElement.time);
                    this.mouseDownElement.updateNote();
                }
            }
            if (this.isSelecting) {
                const rect = this.canvasElement.getBoundingClientRect();
                const x = e.clientX - rect.left + this.canvasElement.scrollLeft;
                const y = e.clientY - rect.top;
                const width = x - this.startSelection[0];
                const height = y - this.startSelection[1];
                if (width < 0) {
                    this.selectionElement.style.left = `${x}px`;
                }
                if (height < 0) {
                    this.selectionElement.style.top = `${y}px`;
                }
                this.selectionElement.style.width = `${Math.abs(width)}px`;
                this.selectionElement.style.height = `${Math.abs(height)}px`;
                let selectedNotes = this.getSelectedNotes();
                if (e.shiftKey) {
                    selectedNotes = [...selectedNotes, ...this.selectedNotes.filter(n => !selectedNotes.includes(n))]; // Add to selection (shift)
                    selectedNotes.forEach(n => n.htmlElement.classList.add("view-note-note-selected"));
                    this.selectedNotes = selectedNotes;
                } else {
                    this.selectedNotes.forEach(n => n.htmlElement.classList.remove("view-note-note-selected"));
                    this.selectedNotes = selectedNotes;
                }
                this.selectedNotes.forEach(n => n.htmlElement.classList.add("view-note-note-selected"));
            }

            if (this.isMovingNotes && this.movingNote && this.selectedNotes.length === 0) {
                this.movingNote.time = Math.min(Math.max(0, beat), this.songLength * this.timeSig - this.movingNote.duration);
                this.movingNote.note = Math.max(0, note); // TODO: Add max note limit
                this.movingNote.updateNote();
            } else if (this.isMovingNotes && this.selectedNotes.length > 0) {

                const timeDiff = beat - this.movingNote.time;
                const noteDiff = note - this.movingNote.note;
                this.selectedNotes.forEach(n => {
                    n.time = Math.min(Math.max(0, n.time + timeDiff), this.songLength * this.timeSig - n.duration);
                    n.note = Math.max(0, n.note + noteDiff); // TODO: Add max note limit
                    n.updateNote();
                });
            }
        });
        document.addEventListener("mouseup", (e) => {
            // Same as mousemove, we don't want to have only mouseup inside the container
            if (this.isMouseDown && this.mouseDownElement) {
                this.isMouseDown = false;
                this.mouseDownElement = null;
                this.modified();
            }
            // DO NOT this.modified() in the mousemove, cause it'll spam the undo buffer
            if (this.isSelecting) {
                this.modified();
                this.selectionElement.style.display = "none";
                this.isSelecting = false;
            }
            if (this.isMovingNotes) {
                this.modified();
                this.movingNote = null;
                this.isMovingNotes = false;
            }
        });
        document.addEventListener("contextmenu", (e) => {
            if (!this.container.contains(e.target)) {
                return; // Ignore clicks outside of the container
            }
            e.preventDefault();
            const rect = this.canvasElement.getBoundingClientRect();
            const x = e.clientX - rect.left + this.canvasElement.scrollLeft - this.PIANO_NOTE_WIDTH;
            const y = e.clientY - rect.top;
            const { note: noteIndex, beat: beatIndex } = this.absoluteCoordsToNote(x, y);
            const noteToRemove = this.getNoteByTimeAndNote(beatIndex, noteIndex);
            if (this.selectedNotes.length === 0) {
                if (noteToRemove) {
                    noteToRemove.remove();
                }
                this.modified();
            } else if (!e.ctrlKey && noteToRemove) {// Allow selection after + only remove if on a real note
                this.selectedNotes.forEach(n => n.remove());
                this.selectedNotes = [];
                this.modified();
            }
        });
        document.addEventListener("keydown", (e) => {
            // if (!this.container.contains(e.target)) {
            //     return; // Ignore clicks outside of the container
            // }
            if (!this.app__isFocused()) {
                return; // Don't trigger shortcuts if the view is not focused
            }
            if (e.key === "c" && e.ctrlKey) {
                if (this.selectedNotes.length > 0) {
                    this.copyBuffer = this.selectedNotes.map(n => ({ time: n.time, note: n.note, duration: n.duration, velocity: n.velocity }));
                }
            }
            if (e.key === "v" && e.ctrlKey) {
                e.preventDefault();
                if (this.copyBuffer.length > 0) {
                    this.selectedNotes.forEach(n => n.htmlElement.classList.remove("view-note-note-selected"));
                    this.selectedNotes = []; // Reset selection
                    this.copyBuffer.forEach(note => {
                        const newNote = new Note(note.time, note.note, note.duration, note.velocity, this);
                        newNote.placeNote();
                        this.notes = [newNote, ...this.notes];
                        newNote.htmlElement.classList.add("view-note-note-selected");
                        this.isMovingNotes = true;
                        this.movingNote = newNote; // Move the first pasted note with the mouse, the others will follow it
                        this.selectedNotes.push(newNote);
                    });
                    // DO NOT move the notes by an offset, this is very annoying, and a lot of programs does it wrong by pasting the notes with an offset from the original position.
                    this.modified();
                }
            }
            if (e.key === " ") {
                e.preventDefault(); // Avoid scrolling when space is pressed
                if (this.isPlaying) {
                    const { beat } = this.absoluteCoordsToNote(this.playerBar.offsetLeft - this.PIANO_NOTE_WIDTH * 2, 0);
                    this.currentPlayPosition = beat;
                    this.stop();
                } else {
                    this.isPlaying = true;
                    this.play();
                }
            }

            if (e.key === "z" && e.ctrlKey) {
                e.preventDefault();
                if (this.actionBufferPointer > 0) {
                    this.actionBufferPointer--;
                    this.loadFromArray(this.actionBuffer[this.actionBufferPointer]);
                }
            }
            if (e.key === "y" && e.ctrlKey) {
                e.preventDefault();
                if (this.actionBufferPointer < this.actionBuffer.length - 1) {
                    this.actionBufferPointer++;
                    this.loadFromArray(this.actionBuffer[this.actionBufferPointer]);
                }
            }
            // if (e.key === "s" && e.ctrlKey) {
            //     e.preventDefault();
            //     this.save();
            //     alert("Melody saved!");
            // }
            // if (e.key === "l" && e.ctrlKey) {
            //     e.preventDefault();
            //     this.load();
            //     alert("Melody loaded!");
            // }
        });
        document.addEventListener("wheel", (e) => {
            if (!this.container.contains(e.target)) {
                return; // Ignore clicks outside of the container
            }
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = Math.sign(e.deltaY);
                this.currentZoomX = Math.max(50, Math.min(200, this.currentZoomX - delta * 10));
                this.zoomX(this.currentZoomX);
            }
            if (e.shiftKey) {
                e.preventDefault();
                const delta = Math.sign(e.deltaY);
                this.currentZoomY = Math.max(50, Math.min(200, this.currentZoomY - delta * 10));
                this.zoomY(this.currentZoomY);
            }
        }, { passive: false });
        // this.copyBtn.addEventListener("click", () => {
        //     if (!this.container.contains(e.target)) {
        //         return; // Ignore clicks outside of the container
        //     }
        //     const notesTxt = this.generateNotesTxt();
        //     navigator.clipboard.writeText(notesTxt).then(() => {
        //         alert("notes.txt copied to clipboard!");
        //     }).catch(err => {
        //         alert("Failed to copy notes.txt: " + err);
        //     });
        // });
        // Idk why it fuck things up
        // window.addEventListener("resize", () => {
        //     this.updateResize();
        // });
        this.updateResize();
        setTimeout(() => {
            this.zoomY(this.currentZoomY);
        }, 500);
    };

    /**
     * Update the size of the player bar and any other necessary elements when the window is resized to ensure the layout remains consistent and functional.
     */
    updateResize() {
        this.playerBar.style.height = `${this.container.scrollHeight}px`;
        this.canvasElement.style.height = `${this.container.scrollHeight + 10}px`; // Scrolbar compensation
        this.notesCanvasBg.style.width = `${this.songLength * this.timeSig * this.currentBarWidth}px`;
        this.notesCanvasContainer.style.width = `${this.songLength * this.timeSig * this.currentBarWidth}px`;
        this.notesCanvasContainer.style.height = `${this.container.scrollHeight}px`;
    }

    /**
     * Start the playback of the notes.
     */
    play() {
        // No sound, for now. I still need to finish VSTJs library and integrate it here.
        const startTime = performance.now();
        if (this.playInterval) {
            clearInterval(this.playInterval);
        }
        // this.currentPlayPosition = this.currentPlayPosition;
        this.playInterval = setInterval(() => {
            const elapsedTime = performance.now() - startTime;
            const currentBeat = (elapsedTime / this.convertBeatToMs(1)) + this.currentPlayPosition;
            // const currentBar = Math.floor(currentBeat / 4);
            const notes = this.getNotesAtBeat(currentBeat);
            // TURN OFF THE NOTES FIRST!!!
            this.notes.forEach(note => {
                if (note.checkEnd(currentBeat)) {

                    const midiNote = this.convertNoteToMidiNoteNumber(note.note);
                    const currentInstrument = this.app__getSelectedPartData()[1].instrumentId;
                    const audioManager = this.app__getAudioManager();
                    if (audioManager) {
                        audioManager.play(currentInstrument, {
                            type: "note",
                            internalType: "noteOff",
                            note: midiNote,
                            velocity: 0,
                        });
                    }
                }
            })
            notes.forEach(note => {
                if (note.checkPlay(currentBeat)) {
                    const midiNote = this.convertNoteToMidiNoteNumber(note.note);
                    const currentInstrument = this.app__getSelectedPartData()[1].instrumentId;
                    const audioManager = this.app__getAudioManager();
                    if (audioManager) {
                        audioManager.play(currentInstrument, {
                            type: "note",
                            internalType: "noteOn",
                            note: midiNote,
                            velocity: note.velocity,
                        });
                    }
                }
            });

            const fakeCurrentBeat = ((performance.now() - (startTime + (this.app__getSharedPool("global/audio/vstWeb").getBufferTime() * 1000))) / this.convertBeatToMs(1)) + this.currentPlayPosition;

            if (fakeCurrentBeat >= 0) { // We use a fake current beat that takes into account the audio buffer time to sync the player bar with the actual sound, otherwise it'll be off by the buffer time
                this.playerBar.style.left = `${(fakeCurrentBeat * this.currentBarWidth)}px`;
            }
            if (currentBeat - (this.PIANO_NOTE_WIDTH / this.currentBarWidth) >= this.songLength * this.timeSig) {
                this.stop();
                this.currentPlayPosition = 0;
                this.updatePlayerBar();
            }
        }, 5);
    }

    /**
     * Stop the playback of the notes and reset the player bar and note states.
     */
    stop() {
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
            this.currentPlayPosition = Math.round(this.playerBar.offsetLeft / this.currentBarWidth); // Sync the play position with the player bar, in case the user moved it during playback
        }
        this.updatePlayerBar();
        this.isPlaying = false;
        this.notes.forEach(note => note.resetPlay());
        const notes = [];
        this.notes.forEach((note) => {// Make sure ALL notes are off
            const midiNote = this.convertNoteToMidiNoteNumber(note.note);
            if (notes.indexOf(midiNote) === -1) { // No need to turn off the note again if it's already turned off in the checkEnd loop above
                const currentInstrument = this.app__getSelectedPartData()[1].instrumentId;
                const audioManager = this.app__getAudioManager();
                if (audioManager) {
                    audioManager.play(currentInstrument, {
                        type: "noteOff",
                        note: midiNote,
                        velocity: 0,
                    });
                }

            }
            notes.push(midiNote);
        })
    }

    /**
     * Update the position of the player bar based on the current play position.
     */
    updatePlayerBar() {
        this.playerBar.style.left = `${(this.currentPlayPosition * this.currentBarWidth)}px`;
    }

    // /**
    //  * @deprecated This method is no longer used as the editor now supports multiple notes and a more complex data structure. It was originally intended to save a single note's data to localStorage.
    //  * @param {string} keyName The key name to use for saving in localStorage
    //  */
    // save(keyName = "notesCreatorNotes") {
    //     const notesData = this.notes.map(note => ({
    //         time: note.time,
    //         note: note.note,
    //         duration: note.duration
    //     }));
    //     localStorage.setItem(keyName, JSON.stringify(notesData));
    // }

    // /**
    //  * @deprecated This method is no longer used as the editor now supports multiple notes and a more complex data structure. It was originally intended to load a single note's data from localStorage.
    //  * @param {string} keyName The key name to use for loading from localStorage
    //  */
    // load(keyName = "notesCreatorNotes") {
    //     const notesData = JSON.parse(localStorage.getItem(keyName) || "[]");
    //     this.notes = notesData.map(n => new Note(n.time, n.note, n.duration, this));
    //     this.notes.forEach(note => note.placeNote());
    // }

    /**
     * Load notes from an array of note objects, where it can be serialized (mostly used to the undo/redo buffer)
     * @param {object[]} notesArray 
     */
    loadFromArray(notesArray) {
        this.app__setSelectedPartData(notesArray);
        this.notes.forEach(note => note.remove());
        this.notes = notesArray.map(n => new Note(n.time + Math.round(this.PIANO_NOTE_WIDTH / this.currentBarWidth), n.note, n.duration, n.velocity, this));
        this.notes.forEach(note => note.placeNote());
    }

    /**
     * Save the current notes to an array of note objects that can be serialized, mostly used for the undo/redo buffer
     * @returns {object[]} Array of note objects that can be serialized, mostly used for the undo/redo buffer
     */
    saveToArray() {
        return this.notes.map(note => ({
            time: note.time - Math.round(this.PIANO_NOTE_WIDTH / this.currentBarWidth), // We need to subtract the offset caused by the piano note width. This is a bit hacky, but else I need to rewrite the entire mouse event system to not have this offset in the first place, and it's not worth it for now
            note: note.note,
            duration: note.duration,
            velocity: note.velocity
        }));
    }

    /**
     * Zoom the editor horizontally by adjusting the width of the bars and updating the positions and sizes of all notes accordingly.
     * @param {number} percent 
     */
    zoomX(percent) {
        percent = Math.max(25, Math.min(400, percent));

        this.currentBarWidth = Math.floor(this.BAR_WIDTH * (percent / 100));

        const totalWidth = this.songLength * this.timeSig * this.currentBarWidth;
        this.notesCanvasBg.style.width = `${totalWidth}px`;
        this.notesCanvasBg.style.setProperty("--view-note-note-width", `${this.currentBarWidth}px`);
        this.notesCanvas.style.width = `${totalWidth}px`;

        this.notes.forEach(note => note.updateNote());
        this.updatePlayerBar();
    }

    /**
     * Zoom the editor vertically by adjusting the height of the note lines and updating the positions of all notes accordingly.
     * @param {number} percent 
     */
    zoomY(percent) {
        percent = Math.max(25, Math.min(400, percent));
        this.noteLineHeight = Math.floor(this.BAR_WIDTH * (percent / 100));


        this.canvasElement.style.setProperty("--view-note-line-height", `${this.noteLineHeight}px`);
        this.vertNotes.style.setProperty("--view-note-line-height", `${this.noteLineHeight}px`);
        this.vertNotes.style.height = `${this.notesBgLines.length * this.noteLineHeight}px`;

        this.notes.forEach(note => note.updateNote());
        this.updateResize();
    }

    /**
     * callback to save the current state of the notes to the undo buffer
     */
    modified() {
        const save = this.saveToArray()
        this.app__setSelectedPartData(save);
        this.actionBuffer.push(save);
        this.actionBuffer = this.actionBuffer.slice(0, this.actionBufferPointer + 1); // Remove any redo history if we made a new action
        this.actionBufferPointer++;
        if (this.actionBuffer.length > this.maxActionBuffer) {
            this.actionBuffer.shift();
        }
    }

}

// window.addEventListener("DOMContentLoaded", () => {
//     const notesCreator = new NotesCreator();
//     notesCreator.autoHtml();
//     notesCreator.genNotes();
//     notesCreator.registerEvents();
//     window.mainMelodyCreator = notesCreator; // Expose for debugging
// });