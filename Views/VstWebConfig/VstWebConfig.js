import { VstWorker } from "../../src/Audio/Vst.js";
import PlayAudioStreamable from "../../VstWeb/src/PlayAudioStreamable.js";
import { ViewTemplate } from "../Template/ViewTemplate.js";

export class VstWebConfig extends ViewTemplate {
    // TODO: Make it translation-friendly
    HTML_TEMPLATE = `
    <div class="vst-web-config-container">
        <div class="vst-web-config-warning-popup">
            <h1 class="vst-web-config-red-asf">READ THIS BEFORE DOING ANYTHING!!!</h1>
            <div class="vst-web-config-warning-popup-content">
                <p>THIS IS A TEST IMPLEMENTATION AND MAY NOT WORK AS EXPECTED.</p>
                <p>THIS WILL USE A LOT OF RESOURCES. USE ONLY ON A GOOD COMPUTER</p>
                <p class="vst-web-config-warning-popup-p-accent"><strong>!! THIS WILL USE A LOT OF DATA (INTERNAL
                        STORAGE)
                        !!</strong></p>
                <p>DEPENDING ON YOUR SYSTEM CONFIGURATION, THIS MIGHT USE UP TO ~2 GB OF STORAGE</p>
                <p>WHENEVER YOU WANT TO STOP USING THE APPLICATION, CLICK ON THE "PURGE ALL DATA" BUTTON IN THE SETTINGS
                </p>
                <p>(technical: this runs an Arch VM with wine, which can be <strong>VERY</strong> resource-intensive)
                </p>
                <button id="vst-web-config-warning-acknowledge">Understood</button>
            </div>
        </div>
        <div class="vst-web-config-view-vm">
            <div>
                <header>
                    <div class="vst-web-config-vm-view-close"><span>&times;</span></div>
                    <h2>VM View [Advanced]</h2>
                    <input type="text" placeholder="Enter text here (to allow pasting into VM)" id="vst-web-config-vm-input">
                    <button id="vst-web-config-paste-to-vm">Paste to VM</button>
                    <p class="no-mp vst-web-config-muted">You can still type normally.</p>
                    <h3 class="no-mp">Actions:</h3>
                    <button id="vst-web-config-vm-stop">Stop current script (Ctrl+C)</button>
                    <h3 class="no-mp">Not currently supported:</h3>
                    <button class="btn-disabled" disabled>Save v86 state</button>
                </header>
            </div>
            <canvas class="vst-web-config-vm-canvas"></canvas>
        </div>
        <h1>VST Web Config</h1>
        <h2>Run 32bit VST2 plugins with WebDAW.</h2>
        <button id="vst-web-config-show-warning">Show warning popup again</button>
        <div class="vst-web-config-stats">
            <h3 class="vst-web-config-stats-title">Statistics:</h3>
            <p>Storage: <span id="storage-usage">Click to view</span></p>
            <div class="vst-web-config-mem">
                <p>Memory Usage: <span id="memory-usage">0 MB</span>
                <!-- <div value="0" id="vst-web-config-memory-progress" max="100"></div> -->
            </div>
            <div class="vst-web-config-stats-status">
                <p>VST Web status: <span id="vst-web-config-status">Not initialized</span></p>
            </div>
            </p>
            <div class="vst-web-config-power-options">
                <div class="vst-web-config-stop">
                    <button id="vst-web-config-stop">Stop</button>
                </div>
                <div class="vst-web-config-select-and-start">
                    <select id="vst-web-config-plugin-select">
                        <option>-- Select a plugin --</option>
                    </select>
                    <br>
                    <button id="vst-web-config-start">Start</button>
                    <button id="vst-web-config-delete">Delete</button>
                    <p id="vst-web-config-pluginselect-error vst-web-config-form-error">&ThinSpace;</p>
                    <div class="vst-web-config-select-loader"></div>
                </div>
            </div>
        </div>
        <div class="vst-web-config-setup-label">
        </div>
        <input type="checkbox" id="vst-web-config-setup-btn" hidden>
        <label class="btn vst-web-config-setup-label" for="vst-web-config-setup-btn">
            Setup <span class="vst-web-config-btn-arrow"></span>
        </label>
        <div class="vst-web-config-setup">
            <h3>Setup (or Configuration)</h3>
            <p>You need:</p>
            <ul>
                <li>A <strong>standalone</strong> VST2 plugin (<strong>32BIT!</strong>) bundled into a .zip file</li>
                <li>At least 8 GB of RAM for your web browser</li>
                <li>A modern web browser with WebAssembly support (e.g., Chrome, Firefox, Edge)</li>
                <li>A good internet connection (fast) !! this will use a lot of data !!</li>
            </ul>
            <div class="vst-web-config-vst">
                <p>Upload your VST plugin (.zip file):</p>
                <input type="file" id="vst-upload" accept=".zip" class="vst-web-config-upload-btn">
                <br>
                <div class="vst-web-config-save-locally-ig">
                    <input type="checkbox" id="vst-web-config-save-locally">
                    <label for="vst-web-config-save-locally">Save in your browser (might use a lot of storage)</label>
                </div>
                <p>And then select the target DLL:</p>
                <select id="dll-select">
                    <option value="">-- Select a DLL --</option>
                </select>
                <button>Begin processing (~40s-1min)</button>
                <p class="vst-web-config-setup-error vst-web-config-form-error"></p>
                <p class="vst-web-config-setup-success"></p>
                <div class="vst-web-config-loader"></div>
            </div>
        </div>
        <div class="vst-web-config-disabled-buttons">
            <p>Features to be implemented:</p>
            <button class="btn-disabled" disabled>Download entire system locally</button>
            <button class="btn-disabled" disabled>Multi-plugin support</button>
        </div>
        <hr>
        <button class="btn" id="vst-web-config-view-vm">View VM [Advanced]</button>
        <div class="vst-web-config-disable-all">
            <input type="checkbox" id="vst-web-config-disable-all-checkbox">
            <label for="vst-web-config-disable-all-checkbox">Disable all VST Web features (! you won't be able to use any VST plugins + native js plugins aren't supported yet !)</label> <!-- TODO: Update when js plugins are supported -->
        </div>
        <p class="vst-web-config-muted">Note: This is a test implementation and may not work as expected. This runs 100%
            in
            the browser.
        </p>
        <br>
        (Made with <a target="_blank" href="https://github.com/4rchXceed/VstWeb">VstWeb</a>, uses <a target="_blank"
            href="https://github.com/copy/v86">copy/v86</a>)
    </div>
    `;

    constructor() {
        super();
        this.VIEW_NAME = "VstWebConfig";
        this.warningAcknowledgedButton = null;
        this.showWarningButton = null;
        this.warningPopup = null;
        this.storageUsageElem = null;
        this.memoryUsageElem = null;
        // this.memoryProgressElem = null;
        this.pluginSelect = null;
        this.stopButton = null;
        this.selectStartButton = null;
        this.selectLoader = null;
        this.pluginSelectError = null;
        this.uploadInput = null;
        this.dllSelect = null;
        this.vmViewCanvas = null;
        this.beginProcessingButton = null;
        this.vmViewCloseButton = null;
        this.vstWebStatusElem = null;
        this.pasteToVmButton = null;
        this.isVmViewOpen = false;
        this.vmInput = null;
        this.vmViewInterval = null;
        this.loaderSetup = null;
        this.vmSelectDeleteButton = null;
        this.vmViewStopButton = null;
        this.vmView = null;
        this.setupSuccessElem = null;
        this.vmSetupErrorElem = null;
        this.disableAllCheckbox = null;
        this.saveLocallyCheckbox = null;
        this.warningAcknowledged = this.app__getVal("warningAcknowledged") || false;
        if (!window.performance) {
            window.warn("Performance memory API not supported, memory usage stats will be unavailable");
        };
    }

    genHtml(container) {
        container.innerHTML = this.HTML_TEMPLATE;
        this.warningAcknowledgedButton = container.querySelector("#vst-web-config-warning-acknowledge");
        this.showWarningButton = container.querySelector("#vst-web-config-show-warning");
        this.warningPopup = container.querySelector(".vst-web-config-warning-popup");
        this.storageUsageElem = container.querySelector("#storage-usage");
        this.memoryUsageElem = container.querySelector("#memory-usage");
        // this.memoryProgressElem = container.querySelector("#vst-web-config-memory-progress");
        this.pluginSelect = container.querySelector("#vst-web-config-plugin-select");
        this.stopButton = container.querySelector(".vst-web-config-stop button");
        this.selectStartButton = container.querySelector(".vst-web-config-select-and-start #vst-web-config-start");
        this.vmSelectDeleteButton = container.querySelector(".vst-web-config-select-and-start #vst-web-config-delete");
        this.pluginSelectError = container.querySelector("#vst-web-config-pluginselect-error");
        this.vmViewCanvas = container.querySelector(".vst-web-config-vm-canvas");
        this.uploadInput = container.querySelector("#vst-upload");
        this.dllSelect = container.querySelector("#dll-select");
        this.selectLoader = container.querySelector(".vst-web-config-select-loader");
        this.vmViewButton = container.querySelector("#vst-web-config-view-vm");
        this.beginProcessingButton = container.querySelector(".vst-web-config-vst button");
        this.saveLocallyCheckbox = container.querySelector("#vst-web-config-save-locally");
        this.vmViewCloseButton = container.querySelector(".vst-web-config-vm-view-close");
        this.vmView = container.querySelector(".vst-web-config-view-vm");
        this.pasteToVmButton = container.querySelector("#vst-web-config-paste-to-vm");
        this.vmInput = container.querySelector("#vst-web-config-vm-input");
        this.vmViewStopButton = container.querySelector(".vst-web-config-vm header button");
        this.disableAllCheckbox = container.querySelector("#vst-web-config-disable-all-checkbox");
        this.vstWebStatusElem = container.querySelector("#vst-web-config-status");
        this.vmSetupErrorElem = container.querySelector(".vst-web-config-setup-error");
        this.loaderSetup = container.querySelector(".vst-web-config-loader");
        this.setupSuccessElem = container.querySelector(".vst-web-config-setup-success");
        this.vmViewStopButton = container.querySelector("#vst-web-config-vm-stop");
    }

    registerEvents() {
        if (this.warningAcknowledged) {
            this.warningPopup.style.display = "none";
        } else {
            this.warningPopup.style.display = "block";
        }

        this.selectStartButton.addEventListener("click", async () => {
            const pluginName = this.pluginSelect.value;
            const pluginDatas = this.app__getVal(pluginName);
            this.selectLoader.style.display = "block";
            this.vstWeb().loadState(pluginDatas.state);
            this.selectLoader.style.display = "none";
        });

        this.vmSelectDeleteButton.addEventListener("click", async () => {
            const pluginName = this.pluginSelect.value;
            if (pluginName === "") {
                this.pluginSelectError.textContent = "Please select a plugin to delete";
                return;
            }
            if (await window.confirmDialog(`Are you sure you want to delete the plugin "${pluginName}"? This action cannot be undone.`, "This will only delete the saved plugin data from your browser storage, it won't affect any files on your computer.")) {
                const pluginsIndex = this.app__getVal("pluginsIndex") || { data: {}, i: 0 };
                const currentPlugin = Object.keys(pluginsIndex.data).find(p => pluginsIndex.data[p].name === pluginName);
                delete pluginsIndex.data[currentPlugin];
                this.app__storeVal("pluginsIndex", pluginsIndex);
                this.app__storeVal(pluginName, "deleted"); // Remove the actual plugin data -- TODO: Maybe implement some kind of cleanup system for old plugin data
                this.updateLoadedPlugins();
            }
        });

        this.warningAcknowledgedButton.addEventListener("click", () => {
            this.warningAcknowledged = true;
            this.app__storeVal("warningAcknowledged", true);
            this.warningPopup.style.display = "none";
        });

        this.showWarningButton.addEventListener("click", () => {
            this.warningPopup.style.display = "block";
        });

        this.vmViewCloseButton.addEventListener("click", () => {
            this.isVmViewOpen = false;
            this.vmView.style.display = "none";
            if (this.vmViewInterval) {
                clearInterval(this.vmViewInterval);
                this.vmViewInterval = null;
            }
        });

        this.vmViewButton.addEventListener("click", () => {
            this.isVmViewOpen = true;

            if (this.vstWeb()) {
                this.vmViewInterval = setInterval(async () => {
                    const imgUri = this.vstWeb().getScreen();
                    const img = new Image();
                    img.src = imgUri;

                    this.vmViewCanvas.getContext("2d").drawImage(img, 0, 0);
                    if (this.vmViewCanvas.width !== this.vstWeb().canvas.width || this.vmViewCanvas.height !== this.vstWeb().canvas.height) {
                        this.vmViewCanvas.width = this.vstWeb().canvas.width;
                        this.vmViewCanvas.height = this.vstWeb().canvas.height;
                    }
                    // this.vmViewCanvas.width = img.b_w;
                    // this.vmViewCanvas.height = img.b_h;
                    // this.vmView.style.backgroundImage = `url(${img})`;
                }, 100);
            }
            this.vmView.style.display = "flex";
        });
        this.pasteToVmButton.addEventListener("click", async () => {
            const text = this.vmInput.value;

            this.vstWeb().sendKey([text], false);
        });

        window.addEventListener("keydown", (e) => {
            if (!this.isVmViewOpen) return;
            if (e.target === this.vmInput) return; // Don't send key presses to the VM if the user is typing in the input box
            this.vstWeb().sendKey(e.code, e.ctrlKey);
        });

        this.vmViewStopButton.addEventListener("click", () => {
            this.vstWeb().sendKey("ControlLeft", true); // Send Ctrl to the VM
            this.vstWeb().sendKey("KeyC", false); // Send Ctrl+C to the VM to stop any running script
        });

        this.uploadInput.addEventListener("change", () => {
            const file = this.uploadInput.files[0];
            if (!file) return;
            if (!window.JSZip) {
                window.error(false, "JSZip library not loaded, cannot process uploaded zip file");
                return;
            }
            const jszip = new JSZip();
            jszip.loadAsync(file).then(zip => {
                this.dllSelect.innerHTML = `<option value="">-- Select a DLL --</option>`; // Clear previous options
                zip.forEach((relativePath, _) => {
                    if (relativePath.endsWith(".dll")) {
                        const option = document.createElement("option");
                        option.value = relativePath;
                        option.textContent = relativePath;
                        this.dllSelect.appendChild(option);
                    }
                });
                if (this.dllSelect.options.length === 1) {
                    this.vmSetupErrorElem.textContent = "No DLL files found in the uploaded zip";
                    this.setupSuccessElem.textContent = "";
                } else {
                    this.vmSetupErrorElem.textContent = "";
                }
            }).catch(err => {
                window.error(false, "Failed to read zip file. Make sure it's a valid zip archive.");
                this.vmSetupErrorElem.textContent = "Failed to read zip file. Make sure it's a valid zip archive.";
            });
        });

        this.stopButton.addEventListener("click", () => {
            if (this.vstWeb()) {
                if (this.vstWeb().isIdle) {
                    this.vstWeb().stopIdle();
                    this.stopButton.textContent = "Resume";
                } else {
                    this.vstWeb().idle();
                    this.stopButton.textContent = "Pause";
                }
            }
        });

        this.beginProcessingButton.addEventListener("click", async () => {
            const selectedDll = this.dllSelect.value;
            if (selectedDll === "") {
                this.vmSetupErrorElem.textContent = "Please select a DLL from the dropdown";
                return;
            }
            this.vmSetupErrorElem.textContent = "";
            this.loaderSetup.style.display = "block";
            const arrayBuffer = await this.uploadInput.files[0].arrayBuffer();
            const state = await this.vstWeb().loadVst(arrayBuffer, selectedDll, PlayAudioStreamable, this.saveLocallyCheckbox.checked);
            if (this.saveLocallyCheckbox.checked) {
                const pluginsIndex = this.app__getVal("pluginsIndex") || { data: {}, i: 0 };
                const name = `vstPlugin-${pluginsIndex.i++}`;
                // const state = this.vstWeb().getState();
                pluginsIndex.data[this.uploadInput.files[0].name] = {
                    name: this.uploadInput.files[0].name,
                    size: this.uploadInput.files[0].size + state.state.byteLength, //TODO: Check
                    dll: selectedDll,
                    name: name,
                }
                this.app__storeVal("pluginsIndex", pluginsIndex);
                this.app__storeVal(name, { pluginData: arrayBuffer, state });
                this.updateLoadedPlugins();
                this.setupSuccessElem.textContent = "Plugin saved, for technicals reasons, you need to reload the page and select it from the dropdown";
            } else {
                this.setupSuccessElem.textContent = "VST plugin loaded successfully!";
            }
            this.loaderSetup.style.display = "none";
        });

        this.disableAllCheckbox.checked = window.db.get("global/audio/vstWeb/enabled", "") === false ? true : false; // Default to enabled if not set

        this.disableAllCheckbox.addEventListener("change", async () => {
            const disabled = this.disableAllCheckbox.checked;
            if (disabled && await window.confirmDialog("Are you sure you want to disable all VST Web features? !! You will need to refresh the page after disabling !!", "This will NOT delete data. You can re-enable features later if you change your mind.")) {
                window.db.set("global/audio/vstWeb/enabled", false, "");
            } else if (await window.confirmDialog("Are you sure you want to re-enable VST Web features?", "This will allow you to use VST plugins again. !! You will need to refresh the page after enabling !!")) {
                window.db.set("global/audio/vstWeb/enabled", true, "");
            }
        });

        // this.updateStats();
        this.storageUsageElem.addEventListener("click", () => {
            this.updateStats();
            setTimeout(() => {
                this.storageUsageElem.textContent = "Click to view";
            }, 5000);
        });

        // Faster loop, because it needs less resources (doesn't need to check for memory/storage updates, just VST Web status)
        setInterval(() => {
            if (this.vstWeb()) {
                this.stopButton.disabled = false;
                if (this.vstWeb().isIdle) {
                    this.stopButton.textContent = "Resume";
                } else {
                    this.stopButton.textContent = "Pause";
                }
                const status = this.vstWeb().ready ? "Ready" : (this.vstWeb().started ? "Started (no VST plugin loaded)" : "Not initialized");
                this.vstWebStatusElem.textContent = status;
            } else {
                this.stopButton.disabled = true;
            }
            if (!window.performance || !performance.memory) return;
            const memoryInfo = performance.memory;
            const usedMB = this.toHumanReadableSize(memoryInfo.usedJSHeapSize);
            // const totalMB = (memoryInfo.totalJSHeapSize / (1024 * 1024)).toFixed(2);
            this.memoryUsageElem.textContent = `${usedMB}`;

        }, 1000);

        this.updateLoadedPlugins();
    }

    updateLoadedPlugins() {
        const pluginsIndex = this.app__getVal("pluginsIndex") || { data: {}, i: 0 };
        this.pluginSelect.innerHTML = `<option value="">-- Select a plugin --</option>`; // Clear previous options
        for (const pluginName in pluginsIndex.data) {
            const plugin = pluginsIndex.data[pluginName];
            const option = document.createElement("option");
            option.value = plugin.name;
            option.textContent = `${pluginName} (${this.toHumanReadableSize(plugin.size)})`;
            this.pluginSelect.appendChild(option);
        }
    }

    // Source - https://stackoverflow.com/a/11900218
    // Posted by thomas-peter, modified by community. See post 'Timeline' for change history
    // Retrieved 2026-03-03, License - CC BY-SA 4.0

    roughSizeOfObject(object) {
        let bytes = 0;


        switch (typeof object) {
            case 'boolean':
                bytes += 4;
                break;
            case 'string':
                bytes += object.length * 2;
                break;
            case 'number':
                bytes += 8;
                break;
            case 'object':
                if (object instanceof ArrayBuffer) {
                    bytes += object.byteLength;
                } else {
                    for (const prop in object) {
                        if (object.hasOwnProperty(prop)) {
                            bytes += this.roughSizeOfObject(object[prop]);
                        }
                    }
                }
                break;
        }

        return bytes;
    }


    // Source - https://stackoverflow.com/a/64644467
    // Posted by kochizufan
    // Retrieved 2026-03-03, License - CC BY-SA 4.0

    getStorage = async (db, table) => {
        const self = this;
        return new Promise((resolve, reject) => {
            const tx = db.transaction([table], 'readonly');
            const store = tx.objectStore(table);
            const cursorReq = store.openCursor();
            let count = 0;
            let size = 0;
            cursorReq.onsuccess = function (e) {
                const cursor = cursorReq.result;
                if (cursor) {
                    count++;
                    size = size + self.roughSizeOfObject(cursor.value);
                    cursor.continue();
                }
            };
            cursorReq.onerror = function (e) {
                reject(e);
            };
            tx.oncomplete = function (e) {
                resolve({
                    count: count,
                    size: size
                });
            };
            tx.onabort = function (e) {
                reject(e);
            };
            tx.onerror = function (e) {
                reject(e);
            };
        });
    };

    toHumanReadableSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let unitIndex = 0;
        let size = bytes;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }


    async updateStats() {
        // const usagePercent = ((memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100).toFixed(2);
        // this.memoryProgressElem.value = usagePercent;
        // this.memoryProgressElem.style.background = `linear-gradient(to right, var(--accent) ${usagePercent}%, var(--secondary-bg) ${usagePercent}%)`;
        if (window.db) {
            try {
                const allIndexedDBs = await indexedDB.databases();
                allIndexedDBs.forEach(async dbInfo => {
                    const db = await new Promise((resolve, reject) => {
                        const request = indexedDB.open(dbInfo.name);
                        request.onsuccess = function (event) {
                            resolve(event.target.result);
                        };
                        request.onerror = function (event) {
                            reject(event.target.error);
                        };
                    });
                    const tableNames = db.objectStoreNames;
                    if (tableNames.length === 0) {
                        this.storageUsageElem.textContent = `Storage: 0 MB used (0 items)`;
                        return;
                    } else {
                        for (const tableName of tableNames) {
                            const storageInfo = await this.getStorage(db, tableName);
                            const storageMB = this.toHumanReadableSize(storageInfo.size);
                            this.storageUsageElem.textContent = `${storageMB} used in storage (${storageInfo.count} items)`;
                        }
                    }
                });
            } catch (e) {
                window.warn("Failed to get storage info:", e);
                this.storageUsageElem.textContent = `Storage info unavailable`;
            }
        } else {
            this.storageUsageElem.textContent = `No database available`;
        }
    }

    /**
     * @returns {VstWorker}
     */
    vstWeb() {
        return this.app__getSharedPool("global/audio/vstWeb");
    }

    static canBeOpened() {
        return window.webDaw.sharePools["global/audio/vstWeb"].started; // Only allow opening if the shared pool for VST Web is started, to prevent trying to do actions when the VST Web worker isn't initialized. 
    }
}

// const fakeDb = {
//     set: (key, value, name) => {
//         // console.log(`DB set: [${name}] ${key} =`, value);
//         localStorage.setItem(`${name}:${key}`, JSON.stringify(value));
//     },
//     get: (key, name) => {
//         const val = localStorage.getItem(`${name}:${key}`);
//         if (val === null) return null;
//         try {
//             return JSON.parse(val);
//         } catch (e) {
//             window.warn(`DB get: Failed to parse value for [${name}] ${key}:`, val);
//             return null;
//         }
//     }
// }
// window.db = fakeDb; // For testing purposes

// const app = new VstWebConfig();
// app.genHtml(document.getElementById("app"));
// app.registerEvents();