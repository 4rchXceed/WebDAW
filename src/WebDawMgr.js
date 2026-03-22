import { ChorusEffect } from "./API/Builtin/Effects/Chorus.js";
import { DelayEffect } from "./API/Builtin/Effects/Delay.js";
import { GainEffect } from "./API/Builtin/Effects/Gain.js";
import { NoneInstrument } from "./API/Builtin/NoneInstrument.js";
import { NotePartPlayer } from "./API/Builtin/NotePartPlayer.js";
import { VstInstrument } from "./API/Builtin/VstInstrument.js";
import { AudioMgr } from "./Audio/AudioMgr.js";
import { DB } from "./Db.js";
import { EventSystem } from "./Events.js";
import { Project } from "./Project.js";

export class WebDawMgr {
    static log(...args) {
        console.log("[WebDawMgr]", ...args);
    }

    static popup(title, message) {
        // SWAL2 time???
        alert(`${title}\n\n${message}`);
    }

    static async confirm(title, message) {
        return confirm(`${title}\n\n${message}`);
    }

    static error(doNotPopup = false, ...args) {
        console.error("[WebDawMgr]", ...args);
        if (!doNotPopup) {
            WebDawMgr.popup("Error", args.join(" "));
        }
    }

    static warn(...args) {
        console.warn("[WebDawMgr]", ...args);
    }

    constructor(db) {
        this.db = db;
        this.sharePools = {};
        this.openedViews = {};
        this.__idGenCounter = 0;
        this.currentView = null;
        // Storage for global registry of effects and instruments
        this.globalRegistry = {
            partPlayers: {
                "notes-creator-notes-977701": NotePartPlayer,
            }, // {dataType: PartPlayerClass}
            effects: {
                "builtin-gain-894695": {
                    class: GainEffect,
                    name: "Gain",
                },
                "builtin-chorus-611417": {
                    class: ChorusEffect,
                    name: "Chorus",
                },
                "builtin-delay-758046": {
                    class: DelayEffect,
                    name: "Delay",
                },
            },
            instruments: {
                "vst-95975": {
                    class: VstInstrument,
                    name: "VST Instrument loader",
                },
                "none-25036": {
                    class: NoneInstrument,
                    name: "Default empty instrument (no sound)",
                },
            },
        }
        this.audioManager = null;
        this.currentPart = {
            instrumentId: null,
            partId: null,
        };
        this.project = new Project();
        this.audioManager = new AudioMgr();
        this.eventSystem = new EventSystem();
    }

    static async init() {
        if (!window.webDaw) {
            window.log = WebDawMgr.log; // Expose the log function to the global scope for easy logging
            window.warn = WebDawMgr.warn;
            window.error = WebDawMgr.error;
            window.popup = WebDawMgr.popup;
            window.confirmDialog = WebDawMgr.confirm;
            const db = new DB();
            await db.init();
            window.db = db; // Faster access than window.webDaw.db
            const webDaw = new WebDawMgr(db);
            window.webDaw = webDaw;
            webDaw.audioManager.init(); // Initialize the audio manager (create audio context, etc...)
            this.log("WebDawMgr initialized");
            return webDaw;
        } else {
            WebDawMgr.log("WebDawMgr is already initialized");
        }
    }

    app__registerView(viewName, viewInstance, winboxInstance) {
        this.openedViews[viewName] = {
            view: viewInstance,
            element: winboxInstance.window,
        };
    }

    app__getView(viewName) {
        return this.openedViews[viewName];
    }
    app__unregisterView(viewName) {
        delete this.openedViews[viewName];
    }

    app__registerPlugin(zip) {
        // TODO: Implement unzipping and plugin registration logic
        throw new Error("Not implemented yet");
    }
}