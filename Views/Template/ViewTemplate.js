export class ViewTemplate {
    /**
     * The name of the view.
     */

    /**
     * A template for views. This class is not meant to be used directly, but rather to be extended by other classes that will implement the actual views.
     */
    constructor() {
        this.VIEW_NAME = "BaseView";
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
}