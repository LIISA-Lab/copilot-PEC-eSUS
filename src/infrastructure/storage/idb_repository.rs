use crate::domain::patient::Patient;
use crate::services::traits::PatientRepository;
use std::future::Future;
use std::pin::Pin;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;

// Binding externo pro nosso arquivo `idb_helper.js`
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = ESusIdb, js_name = save_patient, catch)]
    async fn save_patient_js(key: &str, data: JsValue) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(js_namespace = ESusIdb, js_name = get_patient, catch)]
    async fn get_patient_js(key: &str) -> Result<JsValue, JsValue>;
}

pub struct IndexedDbPatientRepository;

impl IndexedDbPatientRepository {
    pub fn new() -> Self {
        Self
    }
}

impl PatientRepository for IndexedDbPatientRepository {
    fn save_patient(
        &self,
        key: &str,
        patient: Patient,
    ) -> Pin<Box<dyn Future<Output = Result<(), String>> + '_>> {
        let key = key.to_string();
        Box::pin(async move {
            let js_value = serde_wasm_bindgen::to_value(&patient)
                .map_err(|e| format!("Erro de serialização IDB: {}", e))?;

            match save_patient_js(&key, js_value).await {
                Ok(_) => Ok(()),
                Err(e) => Err(format!("Falha ao salvar no IndexedDB: {:?}", e)),
            }
        })
    }

    fn get_patient(
        &self,
        key: &str,
    ) -> Pin<Box<dyn Future<Output = Result<Option<Patient>, String>> + '_>> {
        let key = key.to_string();
        Box::pin(async move {
            match get_patient_js(&key).await {
                Ok(js_val) => {
                    if js_val.is_null() || js_val.is_undefined() {
                        return Ok(None);
                    }

                    match serde_wasm_bindgen::from_value::<Patient>(js_val) {
                        Ok(patient) => Ok(Some(patient)),
                        Err(e) => {
                            web_sys::console::log_1(&format!("[e-SUS Lens Rust] Falha ao recuperar paciente do IDB. Ignorando cache. Erro: {}", e).into());
                            Ok(None)
                        }
                    }
                }
                Err(e) => Err(format!("Falha ao buscar no IndexedDB: {:?}", e)),
            }
        })
    }
}
