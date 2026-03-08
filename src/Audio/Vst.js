// import PlayAudioStreamable from "../../VstWeb/src/PlayAudioStreamable.js";

export class VstWorker {
    VSTWEB_CONFIG_TEMPLATE = {
        state: {
            loadState: true,
            stateUrl: "../../VstWeb/states/init.bin",
        },
        syncFiles: {
            loadFiles: true,
            files: [
                "../../VstWeb/programs/remote.exe",
                "../../VstWeb/.tmp/ex"
            ]
        },
        jsZipUrl: "../../VstWeb/lib/jszip.min.js",
        // keybaord_enabled: false
    }

    V86_CONFIG_TEMPLATE = {
        wasm_path: "../../VstWeb/build/v86.wasm",
        bios: {
            url: "../../VstWeb/bin/bios/seabios.bin",
        },
        vga_bios: {
            url: "../../VstWeb/bin/bios/vgabios.bin",
        },
        filesystem: {
            baseurl: "../../VstWeb/bin/arch/",
            basefs: "../../VstWeb/bin/arch.json",
        },
        net_device: {
            relay_url: "fetch",
            type: "virtio"
        },
        memory_size: 3200 * 1024 * 1024, // 3200 MB
    }

    constructor(hiddenHtmlElement, config = { vstWeb: JSON.parse(JSON.stringify(this.VSTWEB_CONFIG_TEMPLATE)), v86: JSON.parse(JSON.stringify(this.V86_CONFIG_TEMPLATE)) }) {
        this.debug = true;
        this.htmlElement = hiddenHtmlElement;
        this.canvas = document.createElement("canvas");
        this.canvas.width = 1024; // TODO: Make it dynamic
        this.canvas.height = 768;
        this.htmlElement.appendChild(this.canvas);
        window.global = window; // Expose the global object for VstWeb not to break
        this.vstWebConfig = config.vstWeb;
        this.worker = new Worker("./src/Audio/VstWorker.js", { type: "module" });
        this.v86Config = config.v86;
        this.started = false; // TODO: Bugfix
        this.ready = false;
        this.isIdle = false;
        this.state = null;
        this.loadedVsts = { "0": 0 }; // Unused. Structure: { vstId: channelId }
    }

    getBufferTime() {
        return window.webDaw.audioManager.bufferTime || 320; // Default to 320ms if not set
    }

    setAudioBufferSize(sizeInMs) {
        window.webDaw.audioManager.bufferTime = sizeInMs;
    }

    stopIdle() {
        if (!this.isIdle) return;
        this.isIdle = false;
        this.worker.postMessage({ type: "idle_stop" });
    }

    idle() {
        if (this.isIdle) return;
        this.isIdle = true;
        this.worker.postMessage({ type: "idle_start" });
    }

    handleMessage(event) {
        if (!event.data) return;
        const { type, data } = event.data;
        if (type === "audio") {
            // TODO: implement, in c++ AND here, an way to distinguish different audio channels (for now we will just have one channel for everything)
            window.webDaw.audioManager.channels[Object.keys(this.loadedVsts)[0]].write(data, "vstWebOutput");
        } else if (type === "imageData") {
            this.canvas.getContext("2d").putImageData(data.imageData, data.x, data.y, data.dx, data.dy, data.b_w, data.b_h);
        } else if (type === "load_done") {
            this.ready = true;
            if (data.hasState) {
                this.state = data.state;
            }
        }
    }

    async init() {
        this.worker.postMessage({ type: "init", data: { vstWebConfig: this.vstWebConfig, v86Config: this.v86Config } });
        await new Promise(resolve => {
            this.worker.onmessage = (event) => {
                if (!event.data) return;
                if (event.data.type === "init_done") {
                    window.log("VstWorker: VM is ready");
                    resolve();
                } else {
                    this.handleMessage(event);
                }
            };
        });
        this.started = true;
    }


    async loadVst(vstArrayBuffer, pluginPath, idle = true, saveState = false) {
        if (!this.started) {
            window.error(false, "VstWorker: Cannot load VST plugin before starting the VM. Call init() first.");
        }
        this.worker.postMessage({ type: "loadVst", data: { vstArrayBuffer, pluginPath, saveState } });
        while (!this.ready) {
            await new Promise((r) => setTimeout(r, 100));
        }
        this.worker.onmessage = (event) => {
            this.handleMessage(event);
        }
        this.ready = true;
        if (idle) {
            this.idle();
        }
        return this.state; // Return the state if it was loaded
    }

    async playNote(note, velocity, duration, channel = 0) {
        if (!this.ready) {
            window.error(false, "VstWorker: Cannot play note before loading VST plugin. Call loadVst() first.");
        }

        // TODO: Implement channels in the worker and use the channel parameter to specify which channel to play the note on
        this.worker.postMessage({ type: "playNote", data: { note, velocity, duration } });
    }

    async noteOn(note, velocity, channel = 0) {
        if (!this.ready) {
            window.error(false, "VstWorker: Cannot turn note on before loading VST plugin. Call loadVst() first.");
        }
        this.worker.postMessage({ type: "noteOn", data: { note, velocity } });
    }

    async noteOff(note, velocity, channel = 0) {
        if (!this.ready) {
            window.error(false, "VstWorker: Cannot turn note off before loading VST plugin. Call loadVst() first.");
        }
        this.worker.postMessage({ type: "noteOff", data: { note, velocity } });

    }

    isRunning() {
        return this.started;
    }

    isReady() {
        return this.ready;
    }

    getScreen() {
        if (!this.started) {
            window.error(false, "VstWorker: Cannot get screen before starting the VM. Call init() first.");
        }
        return this.canvas.toDataURL();
    }

    loadState(state) {
        if (!this.started) {
            window.error(false, "VstWorker: Cannot load state before starting the VM. Call init() first.");
        }
        this.worker.postMessage({ type: "loadState", data: { state } });
        this.ready = true;
    }

    wait(delay) {
        if (!this.ready) {
            window.error(false, "VstWorker: Cannot wait before loading VST plugin. Call loadVst() first.");
        }
        this.worker.postMessage({ type: "wait", data: { delay } });
    }

    sendKey(key, isCtrl = false) {
        if (!this.started) {
            window.error(false, "VstWorker: Cannot send key before loading VST plugin. Call loadVst() first.");
        }
        this.worker.postMessage({ type: "sendKey", data: { key, isCtrl } });
    }
}