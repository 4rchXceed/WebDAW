import { EffectBase } from "../../EffectBase.js";

export class GainEffect extends EffectBase {
    constructor() {
        super();
        this.effectId = "builtin-gain-894695"; // This should be *hardcoded*, so that we can identify the type of effect when loading a project, even if the class definition is missing or has changed.
        this.parameters = {
            gain: 1,
        };
    }

    genHtml(container) {
        super.genHtml(container);
        const h2 = document.createElement("h2");
        h2.textContent = "Gain Effect";
        container.appendChild(h2);
        const label = document.createElement("label");
        label.textContent = "Gain:";
        container.appendChild(label);
        const gainInput = document.createElement("input");
        gainInput.type = "range";
        gainInput.min = 0;
        gainInput.max = 2;
        gainInput.step = 0.01;
        gainInput.value = this.parameters.gain;
        container.appendChild(gainInput);
    }

    registerEvents() {
        const gainInput = this.container.querySelector("input[type=range]");
        gainInput.oninput = () => {
            this.parameters.gain = parseFloat(gainInput.value);
        };
    }

    process(inputBuffer) {
        const outputBuffer = new AudioBuffer({
            length: inputBuffer.length,
            numberOfChannels: inputBuffer.numberOfChannels,
            sampleRate: inputBuffer.sampleRate,
        });
        // From there:
        for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
            const inputData = inputBuffer.getChannelData(channel);
            const outputData = outputBuffer.getChannelData(channel);
            for (let i = 0; i < inputBuffer.length; i++) {
                // To there: We get every single sample of the input buffer
                outputData[i] = inputData[i] * this.parameters.gain; // Simply multiply the input by the gain
            }
        }
        return outputBuffer;
    }

    saveParameters() {
        return {
            gain: this.parameters.gain,
        };
    }

    loadParameters(params) {
        if (params.gain !== undefined) {
            this.parameters.gain = params.gain;
        }
    }
}