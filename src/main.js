// // Dummy test to check the Notes view
// import { NotesCreator } from "../Views/Notes/NotesCreator.js";

// const notesCreator = new NotesCreator();
// notesCreator.genHtml(document.getElementById("notes-container"));
// notesCreator.genNotes();
// notesCreator.registerEvents();
// window.mainMelodyCreator = notesCreator;

import { VstWebConfig } from "../Views/VstWebConfig/VstWebConfig.js";
import { VstWorker } from "./Audio/Vst.js";
import { WebDawMgr } from "./WebDawMgr.js";
import { WindowManager } from "./WindowMgr.js";
// import { NotesCreator } from "../Views/Notes/NotesCreator.js";

WebDawMgr.init().then(async () => {
    // Dummy test to check the VstWebConfig view
    if (window.db.get("global/audio/vstWeb/enabled") === false) {
        window.warn("VstWeb is disabled in the configuration, skipping VstWebConfig view initialization");
    } else {
        const vstWeb = new VstWorker(document.getElementById("vst-web-hidden-container"));
        window.webDaw.sharePools["global/audio/vstWeb"] = vstWeb;
    }

    const windowManager = new WindowManager(document.getElementById("windows"));
    document.getElementById("initVst").onclick = async () => {
        window.webDaw.sharePools["global/audio/vstWeb"].init();
    };
    document.getElementById("qs-audio-buffer-btn").onclick = () => {
        const value = parseInt(document.getElementById("qs-audio-buffer").value);
        if (isNaN(value) || value < 0) {
            alert("Please enter a valid non-negative number for the audio buffer.");
            return;
        }
        window.webDaw.sharePools["global/audio/vstWeb"].setAudioBufferSize(value);// TODO: adjust for new buffer system (audiomgr)
    }
    document.getElementById("openVstConfig").onclick = () => {
        windowManager.openVMView("VstWebConfig");
    };
    document.getElementById("openMidiNotes").onclick = () => {
        windowManager.openVMView("NotesCreator");
    };
    document.getElementById("openSongParts").onclick = () => {
        windowManager.openVMView("SongParts");
    };
    document.getElementById("openMixer").onclick = () => {
        windowManager.openVMView("MixerView");
    };

    document.getElementById("save").onclick = () => {
        window.webDaw.audioManager.save();
        window.webDaw.project.save();
    }
    document.getElementById("load").onclick = () => {
        window.webDaw.project.load();
        window.webDaw.audioManager.load();
        window.webDaw.project.load(); // Idk why but I need to load it 2 times
    }


    // const vstWebConfig = new VstWebConfig();

    // vstWebConfig.genHtml(document.getElementById("vst-web-config-container"));
    // vstWebConfig.registerEvents();
    // window.vstWebConfig = vstWebConfig;
});