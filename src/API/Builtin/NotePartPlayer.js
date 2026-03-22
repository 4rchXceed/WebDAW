import { PartPlayerBase } from "../PartPlayerBase.js";

export class NotePartPlayer extends PartPlayerBase {
    constructor() {
        super();
        this.dataType = "notes-creator-notes-977701"; // This plugin will play note data, which is the data type used by the piano roll view
        this.currentInstrumentId = null; // We need to know which instrument is playing the part, so we can send "play"
        this.playingNotes = []; // Store the currently playing notes
        this.playedNotes = []; // Store the notes that have been played
    }

    convertNoteToMidiNoteNumber(noteIndex) {
        const TOP_MIDI = 95; // B7
        return TOP_MIDI - noteIndex;
    }

    startPlaying(datas, instrumentId) {
        super.startPlaying(datas, instrumentId);
        this.currentInstrumentId = instrumentId;
    }

    update(currentTime, currentBeat) {
        const notesToPlay = this.currentDatas.filter(note => {
            return note.time <= currentBeat && !this.playedNotes.includes(note) && !this.playingNotes.includes(note);
        });
        this.playingNotes.push(...notesToPlay);
        const notesToStop = this.playingNotes.filter(note => {
            return note.time + note.duration <= currentBeat && this.playingNotes.includes(note) && !this.playedNotes.includes(note);
        });
        this.playedNotes.push(...notesToStop);
        for (const note of notesToStop) {
            window.webDaw.audioManager.play(this.currentInstrumentId, {
                type: "note",
                internalType: "noteOff",
                note: this.convertNoteToMidiNoteNumber(note.note),
                velocity: 0,
            });
            this.playingNotes.splice(this.playingNotes.indexOf(note), 1);
        }
        for (const note of notesToPlay) {
            window.webDaw.audioManager.play(this.currentInstrumentId, {
                type: "note",
                internalType: "noteOn",
                note: this.convertNoteToMidiNoteNumber(note.note),
                velocity: note.velocity,
            });
        }
    }
}