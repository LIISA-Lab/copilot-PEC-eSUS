mod domain;
mod infrastructure;
mod services;

use infrastructure::dom_parser::DomPatientExtractor;
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
/// Retorna os dados do paciente extraídos do DOM do e-SUS serializados como JsValue (JSON).
#[wasm_bindgen]
pub fn extract_patient_info() -> Result<JsValue, JsValue> {
    // 1. Instancia o adaptador de Infraestrutura (Lê o DOM)
    let extractor = DomPatientExtractor::new();

    // 2. Injeta o adaptador no Serviço/Caso de Uso
    let service = PatientService::new(extractor);

    // 3. Executa a lógica e formata a saída para o ecossistema Web (JS)
    match service.get_patient_data() {
        Ok(patient) => serde_wasm_bindgen::to_value(&patient)
            .map_err(|err| JsValue::from_str(&format!("Erro de serialização: {}", err))),
        Err(e) => Err(JsValue::from_str(&e)),
    }
}
