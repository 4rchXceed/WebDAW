export class DB {
    constructor() {
        this.dbName = "WebDawDB";
        this.dbVersion = 1;
        this.data = {};
        // this.projectData = {}; // Will be used to store project-specific data
        this.listeners = {};
        this.db = null;
    }

    async init() {
        await this.initIndexedDB();
        await this.loadAllData();
        this.subscribe("*", async (key, value) => {
            await this.indexedDB__write(key, value);
        });
        window.log("DB initialized with IndexedDB");
    }

    set(key, value) {
        let path = key.split("/");
        while (path.length > 1) {
            const segment = path.shift();
            if (this.listeners[segment] && path.length === 0) {
                this.listeners[segment].forEach(callback => callback(key, value));
            }
            if (this.listeners[segment + "/*"]) {
                this.listeners[segment + "/*"].forEach(callback => callback(key, value));
            }
        }
        if (this.listeners["*"]) {
            this.listeners["*"].forEach(callback => callback(key, value));
        }
        this.data[key] = value;
    }

    get(key) {
        return this.data[key];
    }

    subscribe(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
    }

    unsubscribe(key, callback) {
        if (this.listeners[key]) {
            this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
        }
    }

    async indexedDB__write(key, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(["keyValueStore"], "readwrite");
            const store = transaction.objectStore("keyValueStore");
            const request = store.put(value, key);
            request.onerror = event => reject(event.target.error);
            request.onsuccess = () => resolve();
        });
    }

    async indexedDB__read(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(["keyValueStore"], "readonly");
            const store = transaction.objectStore("keyValueStore");
            const request = store.get(key);
            request.onerror = event => reject(event.target.error);
            request.onsuccess = event => resolve(event.target.result);
        });
    }

    async initIndexedDB() {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        await new Promise((resolve, reject) => {
            request.onerror = event => reject(event.target.error);
            request.onsuccess = event => resolve(event.target.result);
            request.onupgradeneeded = event => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("keyValueStore")) {
                    db.createObjectStore("keyValueStore");
                }
            };
        });
        this.db = await new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onerror = event => reject(event.target.error);
            request.onsuccess = event => resolve(event.target.result);
        });
    }

    async loadAllData() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(["keyValueStore"], "readonly");
            const store = transaction.objectStore("keyValueStore");
            const request = store.openCursor();
            request.onerror = event => reject(event.target.error);
            request.onsuccess = event => {
                const cursor = event.target.result;
                if (cursor) {
                    this.set(cursor.key, cursor.value);
                    cursor.continue();
                } else {
                    resolve();
                }
            };
        });
    }
}