use crate::domain::patient::{GraphqlData, Patient, SessionInfo};
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

    /// Pega os dados gerais (Sessão e Paciente) interceptados via GraphQL
    fn get_graphql_data(&self) -> Option<GraphqlData> {
        let window = window()?;
        let storage = window.local_storage().ok()??;

        let intercepted_str = storage.get_item("__ESUS_GRAPHQL_DATA__").ok()??;

        // Tenta desserializar o JSON string para nossa Struct consolidada
        match serde_json::from_str::<GraphqlData>(&intercepted_str) {
            Ok(data) => Some(data),
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

        // Mapeando os seletores CSS (Fallback visual da página "Folha de Rosto")
        let dom_name = Self::get_text_by_selector(&document, "h2.css-k7p917");
        let dom_sex = Self::get_text_by_selector(&document, "div.css-1favdk2");
        let dom_age = Self::get_text_by_selector(&document, "div.css-1tipuyb");
        let dom_cpf = Self::get_text_by_selector(&document, "div.css-122woep");
        let dom_mother_name = Self::get_text_by_selector(&document, "div.css-14pfv3j");
        let dom_cod_cipa = Self::get_text_by_selector(&document, "div.css-mcsicl");

        // Lê os dados robustos do GraphQL
        let graphql_data = self.get_graphql_data();
        let (session_info, gql_patient) = match graphql_data {
            Some(data) => (data.session_info, data.patient_info),
            None => (None, None),
        };

        // Mescla os dados priorizando a API (GraphQL), e caindo pro DOM se a API falhar
        let name = gql_patient
            .as_ref()
            .and_then(|p| p.name.clone())
            .or(dom_name);
        let cpf = gql_patient.as_ref().and_then(|p| p.cpf.clone()).or(dom_cpf);
        let cns = gql_patient.as_ref().and_then(|p| p.cns.clone());
        let mother_name = gql_patient
            .as_ref()
            .and_then(|p| p.mother_name.clone())
            .or(dom_mother_name);
        let sex = gql_patient.as_ref().and_then(|p| p.sex.clone()).or(dom_sex);
        let gender_identity = gql_patient.as_ref().and_then(|p| p.gender_identity.clone());
        let age = gql_patient.as_ref().and_then(|p| p.age.clone()).or(dom_age);
        let ultima_dum = gql_patient.as_ref().and_then(|p| p.ultima_dum.clone());

        // Retorna a entidade estruturada.
        Ok(Patient {
            name,
            sex,
            gender_identity,
            age,
            cpf,
            cns,
            mother_name,
            cod_cipa: dom_cod_cipa,
            ultima_dum,
            session_info,
        })
    }
}
