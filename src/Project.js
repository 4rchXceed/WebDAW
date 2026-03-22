export class Project {
    constructor() {
        this.name = "";
        this.description = "";
        this.channels = {};
        this.loadedInstruments = {};
        this.songData = {
            tempo: 120,
            instrumentData: {}, // { [instrumentId]: { somedata, parts: {partId: {time, duration, name, data, dataType}} } }
            songLength: 200, // In beats (to ms: songLength * (60000 / tempo)
        };
    }

    save() {
        localStorage.setItem("currentProject", JSON.stringify({
            name: this.name,
            description: this.description,
            channels: this.channels,
            loadedInstruments: this.loadedInstruments,
            songData: this.songData,
        })) // This is a *test* only
    }

    load() {
        const projectData = JSON.parse(localStorage.getItem("currentProject")); // This is a *test* only

        if (!projectData) {
            window.log("No project data found, starting with empty project");
            return;
        }

        this.name = projectData.name;
        this.description = projectData.description;
        this.channels = projectData.channels;
        this.loadedInstruments = projectData.loadedInstruments;

        this.songData = projectData.songData;
    }
}