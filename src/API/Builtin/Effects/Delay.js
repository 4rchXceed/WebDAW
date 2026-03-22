import { EffectBase } from "../../EffectBase.js";
import Tuna from "../../../../lib/tuna/tuna.js";

/**
 * All rights of this effect's algorithm belong to the amazing "Tuna" library, which you can find here: https://github.com/Theodeus/tuna/
 */
export class DelayEffect extends EffectBase {
    HTML_TEMPLATE = `
        <h2>Delay Effect</h2>
        <label>Feedback: <input type="range" min="0" max="1" step="0.01" value="${this.parameters.feedback}" class="chorus-feedback"></label>
        <label>Delay Time (ms): <input type="range" min="1" max="10000" step="1" value="${this.parameters.delayTime}" class="chorus-delay"></label>
        <label>Wet Level: <input type="range" min="0" max="1" step="0.01" value="${this.parameters.wetLevel}" class="chorus-wet-level"></label>
        <label>Dry Level: <input type="range" min="0" max="1" step="0.01" value="${this.parameters.dryLevel}" class="chorus-dry-level"></label>
        <label>Cutoff Frequency: <input type="range" min="20" max="22050" step="1" value="${this.parameters.cutoff}" class="chorus-cutoff"></label>
        <label>Bypass: <input type="checkbox" ${this.parameters.bypass ? "checked" : ""} class="chorus-bypass"></label>
        <button class="chorus-update-btn btn">Update</button>
    `;

    constructor() {
        super();
        this.effectId = "builtin-delay-758046";
        this.parameters = {
            feedback: 0.45,    //0 to 1+
            delayTime: 100,    //1 to 10000 milliseconds
            wetLevel: 0.5,     //0 to 1+
            dryLevel: 1,       //0 to 1+
            cutoff: 20000,      //cutoff frequency of the built in lowpass-filter. 20 to 22050
            bypass: false
        };
        this.tunaDelayNode = null;
        this.tuna = null;
    }

    genHtml(container) {
        super.genHtml(container);
        container.innerHTML = this.HTML_TEMPLATE;
    }

    registerEvents() {
        const feedbackInput = this.container.querySelector(".chorus-feedback");
        const delayTimeInput = this.container.querySelector(".chorus-delay");
        const wetLevelInput = this.container.querySelector(".chorus-wet-level");
        const dryLevelInput = this.container.querySelector(".chorus-dry-level");
        const cutoffInput = this.container.querySelector(".chorus-cutoff");
        const bypassInput = this.container.querySelector(".chorus-bypass");
        const updateBtn = this.container.querySelector(".chorus-update-btn");

        feedbackInput.oninput = () => {
            this.parameters.feedback = parseFloat(feedbackInput.value);
        };
        delayTimeInput.oninput = () => {
            this.parameters.delayTime = parseFloat(delayTimeInput.value);
        };
        wetLevelInput.oninput = () => {
            this.parameters.wetLevel = parseFloat(wetLevelInput.value);
        };
        dryLevelInput.oninput = () => {
            this.parameters.dryLevel = parseFloat(dryLevelInput.value);
        };
        cutoffInput.oninput = () => {
            this.parameters.cutoff = parseFloat(cutoffInput.value);
        };
        bypassInput.onchange = () => {
            this.parameters.bypass = bypassInput.checked;
        };
        updateBtn.onclick = () => {
            this.updateEffect();
        };

        feedbackInput.value = this.parameters.feedback;
        delayTimeInput.value = this.parameters.delayTime;
        wetLevelInput.value = this.parameters.wetLevel;
        dryLevelInput.value = this.parameters.dryLevel;
        cutoffInput.value = this.parameters.cutoff;
        bypassInput.checked = this.parameters.bypass;
    }

    updateEffect() {
        console.log(this.tunaDelayNode);

        this.tunaDelayNode.disconnect();
        this.tunaDelayNode = new this.tuna.Delay(this.parameters);
        this.inputOutputNode.connect(this.tunaDelayNode.input);
        this.tunaDelayNode.connect(this.audioContext.destination);
    }

    connect(node, audioContext) {
        super.connect(node, audioContext);
        this.tuna = new Tuna(audioContext);
        this.tunaDelayNode = new this.tuna.Delay(this.parameters);
        node.connect(this.tunaDelayNode.input);
        this.tunaDelayNode.connect(audioContext.destination);
    }

    saveParameters() {
        return {
            feedback: this.parameters.feedback,
            delayTime: this.parameters.delayTime,
            wetLevel: this.parameters.wetLevel,
            dryLevel: this.parameters.dryLevel,
            cutoff: this.parameters.cutoff,
            bypass: this.parameters.bypass
        };
    };

    loadParameters(params) {
        this.parameters.bypass = params.bypass;
        this.parameters.feedback = params.feedback;
        this.parameters.delayTime = params.delayTime;
        this.parameters.wetLevel = params.wetLevel;
        this.parameters.dryLevel = params.dryLevel;
        this.parameters.cutoff = params.cutoff;
    }
}