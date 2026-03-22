/**
 * Simple event system for communication between different parts of the app without tight coupling.
 * When to use?
 * Events are mostly called by the internal WebDaw system (like the AudioMgr when starting playback, ...)
 * To send actions to the internal system (like telling the AudioMgr to play a note), direct method calls are usually better (like webDaw.audioManager.play(...))
 */
export class EventSystem {
    constructor() {
        this.events = {};
    }

    /**
     * Register a new event with the given name. If the event already exists, does nothing. (Can be called automatically when registering a listener or emitting an event, but can be used to explicitly create events if desired.)
     * @param {string} eventName 
     */
    createEvent(eventName) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
    }

    /**
     * Register an event listener for the given event name.
     * @param {string} eventName 
     * @param {Function} callback 
     * @return {string} rId - The id of the registered listener, used for unregistering if needed
     */
    registerEventListener(eventName, callback) {
        if (!this.events[eventName]) {
            console.warn(`Event ${eventName} does not exist. Creating it.`);
            this.createEvent(eventName);
        }
        let rId = 0; // Generate a random id for this listener (used for unregistering)
        while (this.events[eventName].some(([cb, id]) => id === rId)) { // Make sure the id is unique for this event
            rId = Math.random().toString(36).substring(2, 15);
        }
        this.events[eventName].push([callback, rId]);
        return rId;
    }

    /**
     * Emit an event with the given name and data. Calls all registered listeners for that event name with the provided data.
     * @param {string} eventName 
     * @param {any} data (can be null)
     */
    emitEvent(eventName, data = null) {
        if (!this.events[eventName]) {
            console.warn(`Event ${eventName} does not exist. Creating it.`);
            this.createEvent(eventName);
        }
        this.events[eventName].forEach(([callback, _]) => callback(data));
    }

    /**
     * Unregister an event listener for the given event name and listener id.
     * @param {string} eventName 
     * @param {string} rId 
     * @returns {void}
     */
    unregisterEventListener(eventName, rId) {
        if (!this.events[eventName]) {
            console.warn(`Event ${eventName} does not exist.`);
            return;
        }
        this.events[eventName] = this.events[eventName].filter(([_, id]) => id !== rId);
    }
}