import { VstWorker } from "../../Audio/Vst.js";
import { InstrumentBase } from "../InstrumentBase.js";

export class VstInstrument extends InstrumentBase {
    constructor() {
        super();
        this.hasUI = true;
        this.vstWorker = null;
        this.loadedVstsSelect = null;
        this.currentVstId = null;
        this.instrumentId = "vst-95975";
    }

    getLoadedVsts() {
        // TODO: When multi-vst support is implemented, this should return an array of loaded VSTs instead of just the first one, these are VSTIds
        return { "0": "Default" };
    }

    async init() {
        // Nothing to init here...
    }

    updateLoadedVsts() {
        this.loadedVstsSelect.innerHTML = "<option value=\"\" selected>--Select a VST plugin--</option>"; // Clear the select and add the default option
        const loadedVsts = this.getLoadedVsts();
        for (const vstId in loadedVsts) {
            const option = document.createElement("option");
            option.value = vstId;
            option.textContent = loadedVsts[vstId];
            this.loadedVstsSelect.appendChild(option);
        }
        if (this.currentVstId) {
            this.loadedVstsSelect.value = this.currentVstId;
        }
    }

    genHtml(htmlElement) {
        super.genHtml(htmlElement);
        const label = document.createElement("label");
        label.textContent = "VST Plugin:";
        htmlElement.appendChild(label);

        this.loadedVstsSelect = document.createElement("select");
        htmlElement.appendChild(this.loadedVstsSelect);
        this.updateLoadedVsts();
    }

    registerEvents() {
        this.loadedVstsSelect.onchange = (e) => {
            const vstId = e.target.value;
            if (!vstId) return; // No VST selected
            this.currentVstId = vstId;
        };
    }

    play(parameters) {
        if (parameters.type !== "note") return;
        if (!this.currentVstId) return; // No VST selected
        this.vstWeb().stopIdle(); // Stop idle mode to reduce latency for the note that is about to be played
        if (parameters.internalType === "play") {
            this.vstWeb().playNote(parameters.note, parameters.velocity, parameters.duration, this.currentVstId);
        } else if (parameters.internalType === "noteOn") {
            this.vstWeb().noteOn(parameters.note, parameters.velocity, this.currentVstId);
        } else if (parameters.internalType === "noteOff") {
            this.vstWeb().noteOff(parameters.note, parameters.velocity, this.currentVstId);
        }
    }

    tearDown() {
        super.tearDown();
        // Nothing todo
    }

    /**
     * @returns {VstWorker}
     */
    vstWeb() {
        return window.webDaw.sharePools["global/audio/vstWeb"];
    }

    saveParameters() {
        return {
            vstId: this.currentVstId
        }
    }

    loadParameters(parameters) {
        this.currentVstId = parameters.vstId;
        if (this.loadedVstsSelect) {
            this.loadedVstsSelect.value = this.currentVstId;
        }
    }
}