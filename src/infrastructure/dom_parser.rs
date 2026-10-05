use crate::domain::patient::{Patient, SessionInfo};
use crate::services::traits::PatientDataExtractor;
use web_sys::{window, Document};

pub struct DomPatientExtractor;

impl DomPatientExtractor {
    pub fn new() -> Self {
        Self
    }

    /// Função auxiliar para buscar o texto de um elemento no DOM com segurança
    fn get_text_by_selector(document: &Document, selector: &str) -> Option<String> {
        if let Ok(Some(element)) = document.query_selector(selector) {
            let text = element.text_content().unwrap_or_default();
            let trimmed = text.trim().to_string();
            if !trimmed.is_empty() {
                return Some(trimmed);
            }
        }
        None
    }

    /// Pega os dados do GraphQL (Sessão do médico) que foram interceptados e salvos no window
    fn get_graphql_session_data(&self) -> Option<SessionInfo> {
        let window = window()?;
        let storage = window.local_storage().ok()??;

        let intercepted_str = storage.get_item("__ESUS_GRAPHQL_DATA__").ok()??;

        // Tenta desserializar o JSON string para nossa Struct SessionInfo
        match serde_json::from_str::<SessionInfo>(&intercepted_str) {
            Ok(session) => Some(session),
            Err(e) => {
                web_sys::console::log_1(&format!("Erro ao deserializar sessão: {}", e).into());
                None
            }
        }
    }
}

impl PatientDataExtractor for DomPatientExtractor {
    fn extract(&self) -> Result<Patient, String> {
        // Acessa o contexto global do navegador (window) e o DOM (document)
        let window = window().ok_or("Erro: Objeto `window` global não encontrado no navegador.")?;
        let document = window
            .document()
            .ok_or("Erro: Objeto `document` não encontrado na window.")?;

        // Mapeando os seletores CSS fornecidos para a página "Folha de Rosto"
        let name = Self::get_text_by_selector(&document, "h2.css-k7p917");
        let sex = Self::get_text_by_selector(&document, "div.css-1favdk2");
        let age = Self::get_text_by_selector(&document, "div.css-1tipuyb");
        let cpf = Self::get_text_by_selector(&document, "div.css-122woep");
        let mother_name = Self::get_text_by_selector(&document, "div.css-14pfv3j");
        let cod_cipa = Self::get_text_by_selector(&document, "div.css-mcsicl");

        // Lê os dados do GraphQL interceptados pela extensão (Nome do Médico, UBS, etc)
        let session_info = self.get_graphql_session_data();

        // Retorna a entidade estruturada.
        Ok(Patient {
            name,
            sex,
            age,
            cpf,
            mother_name,
            cod_cipa,
            session_info,
        })
    }
}
