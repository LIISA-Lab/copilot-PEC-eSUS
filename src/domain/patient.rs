use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct CondicoesSaude {
    pub gestante: Option<bool>,
    pub maternidade_referencia: Option<String>,
    pub peso_adequado: Option<String>, // autodenominacaoPeso
    pub acamado: Option<bool>,
    pub domiciliar: Option<bool>,
    pub fumante: Option<bool>,
    pub uso_alcool: Option<bool>,
    pub uso_drogas: Option<bool>,
    pub saude_mental: Option<bool>, // stProblemaSaudeMental
    pub hipertensao_arterial: Option<bool>,
    pub diabetes: Option<bool>,
    pub cancer: Option<bool>,
    pub derrame: Option<bool>,
    pub infarto: Option<bool>,
    pub hanseniase: Option<bool>,
    pub tuberculose: Option<bool>,
    pub doenca_cardiaca: Option<bool>,
    pub detalhes_doenca_cardiaca: Option<Vec<String>>, // doencaCardiaca
    pub problema_rins: Option<bool>,
    pub detalhes_doenca_rins: Option<Vec<String>>, // doencaRins
    pub doenca_respiratoria: Option<bool>,
    pub detalhes_doenca_respiratoria: Option<Vec<String>>, // doencasRespiratorias
    pub internacao_12_meses: Option<bool>,                 // stInternacaoUltimos12Meses
    pub causa_internacao: Option<String>,
    pub plantas_medicinais: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct SocioDemografico {
    pub escolaridade: Option<String>,
    pub ocupacao: Option<String>,
    pub situacao_mercado_trabalho: Option<String>,
    pub possui_plano_saude_privado: Option<bool>,
    pub possui_deficiencia: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Patient {
    pub id: Option<String>,
    pub name: Option<String>,
    pub sex: Option<String>,
    pub gender_identity: Option<String>,
    pub age: Option<String>,
    pub cpf: Option<String>,
    pub cns: Option<String>,
    pub mother_name: Option<String>,
    pub telefone_celular: Option<String>,
    pub raca_cor: Option<String>,

    // Dados Clínicos
    pub cod_cipa: Option<String>,
    pub ultima_dum: Option<String>, // Data Inicio Gestação (DUM)
    pub idade_gestacional_dias: Option<u32>, // Idade Gestacional em Dias
    pub condicoes_saude: Option<CondicoesSaude>,

    // Dados Sociais e Estratificação
    pub sociodemografico: Option<SocioDemografico>,

    pub session_info: Option<SessionInfo>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
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
