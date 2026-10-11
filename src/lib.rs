mod domain;
mod infrastructure;
mod services;

use infrastructure::dom_parser::DomPatientExtractor;
use infrastructure::storage::idb_repository::IndexedDbPatientRepository;
use services::patient_service::PatientService;
use wasm_bindgen::prelude::*;

// Habilita rastreamento aprimorado de erros de panic no console do navegador (Debug)
#[wasm_bindgen(start)]
pub fn main_js() -> Result<(), JsValue> {
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();
    Ok(())
}

/// Função principal exposta para o Javascript (Content Script)
/// Retorna os dados do paciente extraídos e consolidados com o IndexedDB.
#[wasm_bindgen]
pub fn extract_patient_info_promise() -> js_sys::Promise {
    wasm_bindgen_futures::future_to_promise(async move {
        // 1. Instancia o adaptador de Infraestrutura do DOM
        let extractor = DomPatientExtractor::new();

        // 2. Instancia o Repositório do IndexedDB
        let repo = IndexedDbPatientRepository::new();

        // 3. Injeta as dependências no Serviço
        let service = PatientService::new(extractor, repo);

        // 4. Executa a lógica Assíncrona de Extração, Validação e Merge
        match service.process_and_get_patient().await {
            Ok(Some(patient)) => {
                let js_val = serde_wasm_bindgen::to_value(&patient)
                    .map_err(|err| JsValue::from_str(&format!("Erro de serialização final: {}", err)))?;
                Ok(js_val)
            },
            Ok(None) => {
                // Retorna explícito para o JS saber que o paciente foi reprovado nas regras de Gestação
                Ok(JsValue::NULL)
            },
            Err(e) => Err(JsValue::from_str(&e)),
        }
    })
}
