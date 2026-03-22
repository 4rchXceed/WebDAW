/**
 * Base class for audio effects plugins.
 */
export class EffectBase {
    DEFAULT_EFFECT_ID = "effectbase-302571"; // This shouldn't be changed
    constructor() {
        this.parameters = {};
        // A good convension is to place a random number after the effect name, to avoid conflicts with other effects that might have the same name.
        this.effectId = "effectbase-302571"; // This should be *hardcoded*, so that we can identify the type of effect when loading a project, even if the class definition is missing or has changed.
        this.inputOutputNode = null;
        this.audioContext = null;
    }

    /**
     * Build the UI for the effect parameters and append it to the given container element.
     * @param {HTMLElement} container
     */
    genHtml(container) {
        // Subclasses can override this method to generate their own HTML UI for the effect parameters.
        if (this.effectId === this.DEFAULT_EFFECT_ID) {
            throw new Error("You should set a unique effectId for your effect class, and not use the default one from EffectBase. This is important for saving/loading projects and identifying the effect type.");
        }
        this.container = container; // Store the container for later use (e.g., in registerEvents or tearUIDown)
    }

    /**
     * !!! element.on* is recommended for event handling in the generated HTML, instead of addEventListener, so you don't need to do anything in tearUIDown !!!
     * Register event listeners for the effect parameters. This method is called after genHtml() to allow subclasses to set up event handling for their UI elements.
     */
    registerEvents() {
        // Subclasses can override this method to register event listeners for their UI elements.
    }

    /**
     * Tear down the instrument's UI. This will be called when the effect is unloaded.
     * Here you would cancel the events
     * THE HTML IS ALREADY REMOVED FROM THE DOM WHEN THIS IS CALLED
     */
    tearUIDown() { }

    /**
     * PLEASE CALL SUPER
     * Connect the effect to the audio context. This is where you would create and connect your audio nodes.
     * @param {AudioNode} node - The input AND output node for the effect.
     * @param {AudioContext} audioContext - The audio context to create and connect audio nodes.
    */
    connect(node, audioContext) {
        this.audioContext = audioContext;
        this.inputOutputNode = node;
        // Subclasses can override this method to create and connect their audio nodes to the given audio context.
    }

    /**
     * Disconnect the effect from the audio context. This is where you would disconnect and clean up your audio nodes.
     */
    disconnect() {
        // Subclasses can override this method to disconnect and clean up their audio nodes when the effect is unloaded.
    }

    /**
     * Process the input audio buffer and return a new audio buffer with the effect applied.
     * @param {AudioBuffer} inputBuffer - The input audio buffer to process.
     * @returns {Promise<AudioBuffer>} A promise that resolves to the processed audio buffer.
     * The audio buffer: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createBuffer is generated with this method
     */
    async process(inputBuffer) {
        // This is a base implementation that simply returns the input buffer unchanged.
        // Subclasses should override this method to apply their specific effect processing.
        return inputBuffer;
    }

    /**
     * This is used when saving/loading a project to store the current state of the effect parameters.
     * @returns {object} A Key-Val dict
     */
    saveParameters() {
        // Subclasses can override this method to return an object representing the current state of the effect parameters for saving.
        return {};
    }

    /**
     * This is used when saving/loading a project to restore the state of the effect parameters.
     * @param {object} params Params returned by saveParameters
     * THIS IS CALLED BEFORE genHtml
     */
    loadParameters(params) {
        // Subclasses can override this method to load the effect parameters from a saved state object.
    }
}