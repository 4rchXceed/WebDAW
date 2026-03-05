import { DB } from "./db.js";

export class WebDawMgr {
    static log(...args) {
        console.log("[WebDawMgr]", ...args);
    }

    static popup(title, message) {
        // SWAL2 time???
        alert(`${title}\n\n${message}`);
    }

    static confirm(title, message) {
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
            window.db = db;
            const webDaw = new WebDawMgr(db);
            window.webDaw = webDaw;
            this.log("WebDawMgr initialized");
            return webDaw;
        } else {
            WebDawMgr.log("WebDawMgr is already initialized");
        }
    }

    app__registerView(viewName, viewInstance) {
        this.openedViews[viewName] = viewInstance;
    }

    app__getView(viewName) {
        return this.openedViews[viewName];
    }
    app__unregisterView(viewName) {
        delete this.openedViews[viewName];
    }
}