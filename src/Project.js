export class Project {
    constructor() {
        this.name = "";
        this.description = "";
        this.channels = {};
        this.loadedInstruments = {};
        this.effects = {};
        this.songData = {
            tempo: 120,
            instrumentData: {}, // { [instrumentId]: { somedata, parts: {partId: {time, duration, name, data}} } }
        };
    }
}