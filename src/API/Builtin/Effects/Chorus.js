import { EffectBase } from "../../EffectBase.js";
import Tuna from "../../../../lib/tuna/tuna.js";

/**
 * All rights of this effect's algorithm belong to the amazing "Tuna" library, which you can find here: https://github.com/Theodeus/tuna/
 */
export class ChorusEffect extends EffectBase {
    HTML_TEMPLATE = `
        <h2>Chorus Effect</h2>
        <label>Rate: <input type="range" min="0.01" max="8" step="0.01" value="${this.parameters.rate}" class="chorus-rate"></label>
        <label>Feedback: <input type="range" min="0" max="1" step="0.01" value="${this.parameters.feedback}" class="chorus-feedback"></label>
        <label>Depth: <input type="range" min="0" max="1" step="0.01" value="${this.parameters.depth}" class="chorus-depth"></label>
        <label>Delay: <input type="range" min="0" max="1" step="0.0001" value="${this.parameters.delay}" class="chorus-delay"></label>
        <label>Bypass: <input type="checkbox" ${this.parameters.bypass ? "checked" : ""} class="chorus-bypass"></label>
        <button class="chorus-update-btn btn">Update</button>
    `;

    constructor() {
        super();
        this.effectId = "builtin-chorus-611417";
        this.parameters = {
            rate: 1.5,         //0.01 to 8+
            feedback: 0.4,     //0 to 1+
            depth: 0.7,        //0 to 1
            delay: 0.0045,     //0 to 1
            bypass: false      //true or false
        };
        this.tunaChorusNode = null;
        this.tuna = null;
    }

    genHtml(container) {
        super.genHtml(container);
        container.innerHTML = this.HTML_TEMPLATE;
    }

    registerEvents() {
        const rateInput = this.container.querySelector(".chorus-rate");
        const feedbackInput = this.container.querySelector(".chorus-feedback");
        const depthInput = this.container.querySelector(".chorus-depth");
        const delayInput = this.container.querySelector(".chorus-delay");
        const bypassInput = this.container.querySelector(".chorus-bypass");
        const updateBtn = this.container.querySelector(".chorus-update-btn");

        rateInput.oninput = () => {
            this.parameters.rate = parseFloat(rateInput.value);
        };
        feedbackInput.oninput = () => {
            this.parameters.feedback = parseFloat(feedbackInput.value);
        };
        depthInput.oninput = () => {
            this.parameters.depth = parseFloat(depthInput.value);
        };
        delayInput.oninput = () => {
            this.parameters.delay = parseFloat(delayInput.value);
        };
        bypassInput.onchange = () => {
            this.parameters.bypass = bypassInput.checked;
        };
        updateBtn.onclick = () => {
            this.updateEffect();
        };

        rateInput.value = this.parameters.rate;
        feedbackInput.value = this.parameters.feedback;
        depthInput.value = this.parameters.depth;
        delayInput.value = this.parameters.delay;
        bypassInput.checked = this.parameters.bypass;
    }

    updateEffect() {
        console.log(this.tunaChorusNode);

        this.tunaChorusNode.disconnect();
        this.tunaChorusNode = new this.tuna.Chorus(this.parameters);
        this.inputOutputNode.connect(this.tunaChorusNode.input);
        this.tunaChorusNode.connect(this.audioContext.destination);
    }

    connect(node, audioContext) {
        super.connect(node, audioContext);
        this.tuna = new Tuna(audioContext);
        this.tunaChorusNode = new this.tuna.Chorus(this.parameters);
        node.connect(this.tunaChorusNode.input);
        this.tunaChorusNode.connect(audioContext.destination);
    }

    saveParameters() {
        return {
            rate: this.parameters.rate,
            feedback: this.parameters.feedback,
            depth: this.parameters.depth,
            delay: this.parameters.delay,
            bypass: this.parameters.bypass
        };
    }

    loadParameters(params) {
        this.parameters.rate = params.rate;
        this.parameters.feedback = params.feedback;
        this.parameters.depth = params.depth;
        this.parameters.delay = params.delay;
        this.parameters.bypass = params.bypass;
    }
}