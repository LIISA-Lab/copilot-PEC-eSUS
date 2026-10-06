use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Patient {
    pub name: Option<String>,
    pub sex: Option<String>,
    pub gender_identity: Option<String>, // Nova chave para identidadeGeneroDbEnum
    pub age: Option<String>,             // Recebe a idade do DOM ou a Data de Nascimento do GraphQL
    pub cpf: Option<String>,
    pub cns: Option<String>, // Adicionado do GraphQL
    pub mother_name: Option<String>,
    pub cod_cipa: Option<String>,
    pub ultima_dum: Option<String>, // Data da Última Menstruação
    pub session_info: Option<SessionInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SessionInfo {
    pub professional_name: Option<String>,
    pub professional_cpf: Option<String>,
    pub cbo_name: Option<String>,
    pub health_unit_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GraphqlData {
    pub session_info: Option<SessionInfo>,
    pub patient_info: Option<Patient>, // Reutilizando a Struct original!
}
