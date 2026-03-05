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
    document.getElementById("openVstConfig").onclick = () => {
        windowManager.openVMView("VstWebConfig");
    };
    document.getElementById("openMidiNotes").onclick = () => {
        windowManager.openVMView("NotesCreator");
    };


    // const vstWebConfig = new VstWebConfig();

    // vstWebConfig.genHtml(document.getElementById("vst-web-config-container"));
    // vstWebConfig.registerEvents();
    // window.vstWebConfig = vstWebConfig;
});