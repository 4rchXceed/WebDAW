import EffectsAudioStreamable from "./EffectsAudioStreamable.js";

export class AudioChannel {
    constructor(name) {
        this.name = name;
        this.volume = 1;
        this.stream = null;
        this.effects = [];
    }

    init() {
        this.stream = new EffectsAudioStreamable();
    }
    /**
     * @param {"vstWebOutput"|"wavArrayBuffer"} audioType 
     */
    write(audioData, audioType) {
        if (audioType === "vstWebOutput") {
            this.stream.write(audioData, this.volume, this.effects);
        } else if (audioType === "wavArrayBuffer") {
            this.stream.writeWav(audioData, this.volume, this.effects);
        }
    }

    registerEffect(effect) {
        this.effects.push(effect);
    }

    unregisterEffect(effect) {
        const index = this.effects.indexOf(effect);
        if (index !== -1) {
            this.effects.splice(index, 1);
        }
    }

    saveState() {
        return {
            name: this.name,
            volume: this.volume,
            effects: this.effects.map(effect => {
                return {
                    params: effect.saveParameters(),
                    name: effect.effectId
                }
            }),
        };
    }

    loadState(state) {
        this.name = state.name;
        this.volume = state.volume;
        for (let i = 0; i < state.effects.length; i++) {
            const effectState = state.effects[i];
            const effectClass = window.webDaw.globalRegistry.effects[effectState.name]?.class;
            if (effectClass) {
                const effectInstance = new effectClass();
                effectInstance.loadParameters(effectState.params);
                this.registerEffect(effectInstance);
            } else {
                window.error(false, `Effect class not found for effectId: ${effectState.name}`);
            }
        }
    }
}