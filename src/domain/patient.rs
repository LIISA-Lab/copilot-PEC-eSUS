use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Patient {
    pub name: Option<String>,
    pub sex: Option<String>,
    pub age: Option<String>,
    pub cpf: Option<String>,
    pub mother_name: Option<String>,
    pub cod_cipa: Option<String>,
}
