import { ViewTemplate } from "../Template/ViewTemplate.js";

class MixerChannel {
    constructor(channelIndex, htmlElement, parent) {
        this.channelIndex = channelIndex;
        this.mixerView = parent;
        this.channel = window.webDaw.audioManager.channels[channelIndex];
        this.htmlElement = htmlElement;
        this.volumeInput = htmlElement.querySelector(".mixer-input-volume");
        this.volumeInput.value = this.channel.volume * 100;
        this.effectsButton = htmlElement.querySelector(".mixer-effects-button");
        this.removeButton = htmlElement.querySelector(".mixer-channel-remove");
        this.editNameButton = htmlElement.querySelector(".mixer-channel-edit-name");
        this.nameElement = htmlElement.querySelector(".mixer-channel-name");
        this.isEditingName = false;
        this.volumeInput.addEventListener("input", () => {
            this.channel.setVolume(this.volumeInput.value / 100);
        });
        this.effectsButton.addEventListener("click", () => {
            this.mixerView.openEffects(this);
        });
        this.removeButton.addEventListener("click", () => {
            this.remove();
        });
        this.editNameButton.addEventListener("click", () => {
            if (!this.isEditingName) {

                this.isEditingName = true;
                this.nameElement.textContent = this.channel.name;
                this.nameElement.contentEditable = true;
                this.nameElement.focus();
            }
        });
        this.mixerView.container.addEventListener("click", (e) => {
            if (e.target !== this.nameElement && e.target !== this.editNameButton && this.isEditingName) {
                this.isEditingName = false;
                this.nameElement.contentEditable = false;
                this.changeName(this.nameElement.textContent);
            }
        });
        this.changeName(this.channel.name);
    }

    remove() {
        if (this.channelIndex == 0) {
            window.error(false, "Cannot remove master channel");
            return;
        }
        window.webDaw.audioManager.removeChannel(this.channelIndex);
        this.htmlElement.remove();
    }

    changeName(newName) {
        this.channel.name = newName;
        this.nameElement.textContent = `Channel ${this.channelIndex} (${newName})`;
    }
}

export class MixerView extends ViewTemplate {
    CHANNEL_HTML_TEMPLATE = `
            <span class="mixer-channel-name">Channel 1 (Default name)</span><span
                    class="mixer-channel-edit-name">✏️</span></span><span class="mixer-channel-remove">🗑️</span>
                <div class="mixer-options">
                    <div class="mixer-input-container">
                        <span>Volume</span>
                        <input type="range" class="mixer-input-volume" max="150" min="0" value="100" />
                    </div>
                    <button class="mixer-effects-button btn">Effects</button>
                </div>
            `;
    HTML_TEMPLATE = `
        <h1>Mixer</h1>
        <h2>Channels</h2>
        <div class="btn mixer-add-channel">+ Channel</div>
        <ul>
        </ul>
        <h2>Current channel effects:</h2>
        <ul class="mixer-effects-list">
            
        </ul>
        <div class="mixer-add-effect-input-container">
            <select class="mixer-add-effect-effect">
                <option value="">-- Select Effect --</option>
                <option value="builtin-gain-894695">Gain</option>
            </select>
            <div class="btn-disabled btn mixer-add-effect">+ Effect</div>
        </div>
        <h2>Effects Settings will be shown there</h2>
        <div class="mixer-effect-settings">
            <p>Double-click an effect to edit its settings.</p>
        </div>
        `;
    EFFECT_HTML_TEMPLATE = `<span class="mixer-effect-name">[effect name]</span><span class="mixer-effect-remove">🗑️</span>`;
    constructor() {
        super();
        this.VIEW_NAME = "MixerView";
        this.container = null;
        this.htmlChannels = [];
        this.currentChannel = null;
        this.openedEffect = null;
    }

    genHtml(container) {
        this.container = container;
        container.classList.add("mixer-main");
        container.innerHTML = this.HTML_TEMPLATE;
        this.addChannelBtn = container.querySelector(".mixer-add-channel");
        this.effectsContainer = container.querySelector(".mixer-effects-list");
        this.effectSelect = container.querySelector(".mixer-add-effect-effect");
        this.addEffectBtn = container.querySelector(".mixer-add-effect");
    }

    addChannel() {
        const channelAndIndex = window.webDaw.audioManager.createChannelAuto("New channel");
        const channelIndex = channelAndIndex[1];
        const channelHtml = document.createElement("li");
        channelHtml.classList.add("mixer-channel");
        channelHtml.innerHTML = this.CHANNEL_HTML_TEMPLATE;
        this.container.querySelector("ul").appendChild(channelHtml);
        const mixerChannel = new MixerChannel(channelIndex, channelHtml, this);
        this.htmlChannels.push(mixerChannel);
    }

    addChannelHtml(channelIndex, channel) {
        const channelHtml = document.createElement("li");
        channelHtml.classList.add("mixer-channel");
        channelHtml.innerHTML = this.CHANNEL_HTML_TEMPLATE;
        this.container.querySelector("ul").appendChild(channelHtml);
        const mixerChannel = new MixerChannel(channelIndex, channelHtml, this);
        mixerChannel.changeName(channel.name);
        this.htmlChannels.push(mixerChannel);
    }

    openEffects(channel) {
        this.addEffectBtn.classList.remove("btn-disabled");
        this.currentChannel = channel;
        this.updateEffectsList();
    }

    openEffectSettings(effect) {
        if (this.openedEffect === effect) return; // Effect settings already opened
        if (this.openedEffect) {
            this.openedEffect.tearUIDown(); // Tear down the previously opened effect settings
        }
        const settingsContainer = this.container.querySelector(".mixer-effect-settings");
        settingsContainer.innerHTML = "";
        effect.genHtml(settingsContainer);
        effect.registerEvents();
        this.openedEffect = effect;
    }

    updateEffectsList() {
        this.effectsContainer.innerHTML = "";
        for (const effect of this.currentChannel.channel.effects) {
            const effectHtml = document.createElement("li");
            effectHtml.classList.add("mixer-effect");
            effectHtml.innerHTML = this.EFFECT_HTML_TEMPLATE;
            effectHtml.querySelector(".mixer-effect-name").textContent = effect.constructor.name;
            effectHtml.querySelector(".mixer-effect-remove").addEventListener("click", () => {
                this.currentChannel.channel.unregisterEffect(effect);
                this.updateEffectsList();
            });
            effectHtml.addEventListener("dblclick", () => {
                this.openEffectSettings(effect);
            });
            this.effectsContainer.appendChild(effectHtml);
        }
    }

    updateEffectSelect() {
        this.effectSelect.innerHTML = `<option value="">-- Select Effect --</option>`; // Clear the select and add the default option
        for (const effectId in window.webDaw.globalRegistry.effects) {
            const option = document.createElement("option");
            option.value = effectId;
            option.textContent = window.webDaw.globalRegistry.effects[effectId].name;
            this.effectSelect.appendChild(option);
        }
    }

    registerEvents() {
        this.addChannelBtn.addEventListener("click", () => {
            this.addChannel();
        });
        this.addEffectBtn.addEventListener("click", () => {
            if (!this.currentChannel) return;
            const effectId = this.effectSelect.value;
            if (!effectId) return;
            const EffectClass = window.webDaw.globalRegistry.effects[effectId]?.class;
            if (!EffectClass) {
                window.error(false, `Effect class for id ${effectId} not found.`);
                return;
            }
            const effectInstance = new EffectClass();
            this.currentChannel.channel.registerEffect(effectInstance);
            this.updateEffectsList();
        });
        this.updateEffectSelect();
        this.load();
    }

    load() {
        // Load channels
        for (const index in window.webDaw.audioManager.channels) {
            if (index !== 0) { // Skip master channel
                const channel = window.webDaw.audioManager.channels[index];
                this.addChannelHtml(index, channel);
            }
        }
    }
}