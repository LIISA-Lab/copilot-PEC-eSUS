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
    },

    // Retorna todos os registros armazenados com seus metadados (key, data, updated_at, sync_status)
    get_all_patients() {
        return this.init().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction("patients", "readonly");
                const store = tx.objectStore("patients");
                const req = store.getAll();

                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => reject(req.error);
            });
        }).catch(err => {
            console.error("[IDB Helper] Erro no get_all_patients:", err);
            return [];
        });
    },

    // Atualiza o sync_status de uma lista de chaves (ex: após sync com sucesso -> 'SINCRONIZADO')
    mark_as_synced(keys) {
        if (!keys || !keys.length) return Promise.resolve();
        return this.init().then(db => {
            return new Promise((resolve, reject) => {
                const tx = db.transaction("patients", "readwrite");
                const store = tx.objectStore("patients");

                keys.forEach(k => {
                    const req = store.get(k);
                    req.onsuccess = () => {
                        if (req.result) {
                            const updated = req.result;
                            updated.sync_status = "SINCRONIZADO";
                            updated.last_synced_at = new Date().toISOString();
                            store.put(updated);
                        }
                    };
                });

                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        }).catch(err => {
            console.error("[IDB Helper] Erro no mark_as_synced:", err);
        });
    }
};

// Exporta as funções para que o wasm-bindgen as encontre globalmente na extensão
window.ESusIdb = ESusIdb;
try {
  if (typeof globalThis !== "undefined") globalThis.ESusIdb = ESusIdb;
} catch (_) {}
