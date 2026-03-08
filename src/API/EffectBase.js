/**
 * Base class for audio effects plugins.
 */
export class EffectBase {
    DEFAULT_EFFECT_ID = "effectbase-302571"; // This shouldn't be changed
    constructor() {
        this.parameters = {};
        // A good convension is to place a random number after the effect name, to avoid conflicts with other effects that might have the same name.
        this.effectId = "effectbase-302571"; // This should be *hardcoded*, so that we can identify the type of effect when loading a project, even if the class definition is missing or has changed.
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
    }

    /**
     * Register event listeners for the effect parameters. This method is called after genHtml() to allow subclasses to set up event handling for their UI elements.
     */
    registerEvents() {
        // Subclasses can override this method to register event listeners for their UI elements.
    }


    /**
     * Process the input audio buffer and return a new audio buffer with the effect applied.
     * @param {AudioBuffer} inputBuffer - The input audio buffer to process.
     * @returns {Promise<AudioBuffer>} A promise that resolves to the processed audio buffer.
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
     */
    loadParameters(params) {
        // Subclasses can override this method to load the effect parameters from a saved state object.
    }
}