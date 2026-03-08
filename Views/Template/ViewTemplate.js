import { AudioMgr } from "../../src/Audio/AudioMgr.js";
import { Project } from "../../src/Project.js";

export class ViewTemplate {
    /**
     * The name of the view.
     */

    /**
     * A template for views. This class is not meant to be used directly, but rather to be extended by other classes that will implement the actual views.
     */
    constructor() {
        this.VIEW_NAME = "BaseView";
        this.disableClose = false; // If true, the view cannot be closed by the user. When the user will try to close the view, it will just be hidden, but not destroyed. If false, another close button will be added and it will be red
    }

    /**
     * Generates the HTML for the view and appends it to the given container element. (NO ELEMENT SHOULD BE CREATED OUTSIDE THE CONTAINER)
     * @param {HTMLElement} container The container element where the view should be rendered. The method should create the necessary HTML elements and append them to the container.
     */
    genHtml(container) {
        window.error(false, "genHtml method must be implemented by subclasses");
    }

    /**
     * Registers the necessary event listeners for the view. This method is called after genHtml, so assume that the HTML elements have been created and are available in the DOM.
     */
    registerEvents() {
        window.error(false, "registerEvents method must be implemented by subclasses");
    }

    /**
     * A static method that returns true if the view can be opened in the current state of the application. This can be used to prevent opening views that require certain conditions to be met.
     * @returns {boolean} Can the view be opened rn?
     */
    static canBeOpened() {
        return true; // By default, the view can be opened. This method can be overridden by subclasses to add conditions for opening the view (for example, if a project is loaded or not)
    }

    /**
     * Tears down the view, removing any event listeners or resources that were created. This method is called when the view is really closed (red button).
     * If disableClose is true, the view will not be destroyed when the user tries to close it, but just hidden, so this method will not be called.
     */
    tearDown() {
        // This method can be called when the view is closed, to clean up any resources or event listeners. By default it does nothing, but it can be overridden by subclasses if needed.
    }

    /**
     * A helper method to get the current project data. This can be useful for views that need to access or modify the project data.
     * @returns {Project} The project data
     */
    app__getProject() {
        return window.webDaw.project;
    }

    /**
     * A helper method to get the data of the currently selected part. This can be useful for views that need to access or modify the part data.
     * @returns {Array|null} The part data and the current part ({instrumentId, partId}), or null if no part is selected
     */
    app__getSelectedPartData() {
        if (window.webDaw.currentPart.partId === null) {
            return null;
        } else {
            const project = this.app__getProject();
            return [project.songData.instrumentData[window.webDaw.currentPart.instrumentId].parts[window.webDaw.currentPart.partId], window.webDaw.currentPart];
        }
    }

    /**
     * A helper method to get the audio manager. This can be useful for views that need to play sounds or access the audio channels.
     * @returns {AudioMgr} The audiomgr class
     */
    app__getAudioManager() {
        return window.webDaw.audioManager;
    }

    /**
     * A helper method to set the data of the currently selected part. This can be useful for views that need to modify the part data.
     * @param {object} data The part data
     */
    app__setSelectedPartData(data) {
        if (window.webDaw.currentPart.partId === null) {
            window.error(false, "No part selected");
        } else {
            const project = this.app__getProject();
            project.songData.instrumentData[window.webDaw.currentPart.instrumentId].parts[window.webDaw.currentPart.partId].data = data;
        }
    }

    /**
     * A helper method to select a part. This can be useful for views that need to change the currently selected part, for example when the user clicks on a part in the piano roll or in the song view.
     * @param {string} instrumentId 
     * @param {string} partId 
     */
    app__setCurrentPart(instrumentId, partId) {
        window.webDaw.currentPart = { instrumentId, partId };
    }

    /**
     * Stores a value in the application's database under the given key and view name. 
     * @param {string} key 
     * @param {object} value 
     * @param {string} name 
     * @returns {boolean} true if the value was stored successfully, false otherwise
     */
    app__storeVal(key, value, name = this.VIEW_NAME) {
        if (!window.db) {
            window.warn("app__storeVal: No database available, cannot store value");
            return false;
        }
        window.db.set(`Views/${name}/${key}`, value, name);
        return true;
    }

    /**
     * Retrieves a value from the application's database under the given key and view name.
     * @param {string} key 
     * @param {string} name 
     * @returns {object|null} The retrieved value or null if not found
     */
    app__getVal(key, name = this.VIEW_NAME) {
        if (!window.db) {
            window.warn("app__getVal: No database available, cannot get value");
            return null;
        }
        return window.db.get(`Views/${name}/${key}`, name);
    }

    /**
     * Retrieves a shared pool object by its key. (A pool is a shared object that can be used to store and share data between views)
     * @param {string} key 
     * @returns {object|null} The retrieved pool object or null if not found
     */
    app__getSharedPool(key) {
        if (window.webDaw && window.webDaw.sharePools[key]) {
            return window.webDaw.sharePools[key];
        } else {
            window.warn(`app__getSharedPool: No pool object available for key "${key}"`);
            return null;
        }
    }

    /**
     * Generates a unique ID string. This can be used to generate IDs for HTML elements or other purposes where a unique identifier is needed.
     * (Why not use random? Because close to 0 risk of having 2 same ids != 0)
     * @returns {string} A unique ID string
     */
    app__idGen() {
        window.webDaw.__idGenCounter = (window.webDaw.__idGenCounter || 0) + 1;
        return `id_${window.webDaw.__idGenCounter}`;
    }

    /**
     * Returns true if the view is currently focused. A focus means: click (mousedown) on the view
     * @returns {boolean} Is the view currently focused?
     */
    app__isFocused() {
        return window.webDaw.currentView === this;
    }
}