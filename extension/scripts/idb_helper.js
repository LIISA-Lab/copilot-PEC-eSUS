// idb_helper.js
// Um módulo Javascript leve para gerenciar o IndexedDB 

const ESusIdb = {
    dbName: "eSUS_Lens_Cache",
    dbVersion: 1,

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("patients")) {
                    db.createObjectStore("patients", { keyPath: "key" });
                }
            };
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    save_patient(key, data) {
        return this.init().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction("patients", "readwrite");
                const store = tx.objectStore("patients");
                
                store.put({ 
                    key: key, 
                    data: data, 
                    updated_at: new Date().toISOString(),
                    sync_status: "PENDENTE"
                });
                
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        }).catch(err => {
            console.error("[IDB Helper] Erro no save_patient:", err);
            throw err;
        });
    },

    get_patient(key) {
        return this.init().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction("patients", "readonly");
                const store = tx.objectStore("patients");
                const req = store.get(key);
                
                req.onsuccess = () => resolve(req.result ? req.result.data : null);
                req.onerror = () => reject(req.error);
            });
        }).catch(err => {
            console.error("[IDB Helper] Erro no get_patient:", err);
            return null; // Retorna null seguro se o BD falhar
        });
    }
};

// Exporta as funções para que o wasm-bindgen as encontre globalmente na extensão
window.ESusIdb = ESusIdb;
