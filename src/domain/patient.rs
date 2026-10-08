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

impl CondicoesSaude {
    pub fn merge(self, old: Self) -> Self {
        Self {
            gestante: self.gestante.or(old.gestante),
            maternidade_referencia: self.maternidade_referencia.or(old.maternidade_referencia),
            peso_adequado: self.peso_adequado.or(old.peso_adequado),
            acamado: self.acamado.or(old.acamado),
            domiciliar: self.domiciliar.or(old.domiciliar),
            fumante: self.fumante.or(old.fumante),
            uso_alcool: self.uso_alcool.or(old.uso_alcool),
            uso_drogas: self.uso_drogas.or(old.uso_drogas),
            saude_mental: self.saude_mental.or(old.saude_mental),
            hipertensao_arterial: self.hipertensao_arterial.or(old.hipertensao_arterial),
            diabetes: self.diabetes.or(old.diabetes),
            cancer: self.cancer.or(old.cancer),
            derrame: self.derrame.or(old.derrame),
            infarto: self.infarto.or(old.infarto),
            hanseniase: self.hanseniase.or(old.hanseniase),
            tuberculose: self.tuberculose.or(old.tuberculose),
            doenca_cardiaca: self.doenca_cardiaca.or(old.doenca_cardiaca),
            detalhes_doenca_cardiaca: self
                .detalhes_doenca_cardiaca
                .or(old.detalhes_doenca_cardiaca),
            problema_rins: self.problema_rins.or(old.problema_rins),
            detalhes_doenca_rins: self.detalhes_doenca_rins.or(old.detalhes_doenca_rins),
            doenca_respiratoria: self.doenca_respiratoria.or(old.doenca_respiratoria),
            detalhes_doenca_respiratoria: self
                .detalhes_doenca_respiratoria
                .or(old.detalhes_doenca_respiratoria),
            internacao_12_meses: self.internacao_12_meses.or(old.internacao_12_meses),
            causa_internacao: self.causa_internacao.or(old.causa_internacao),
            plantas_medicinais: self.plantas_medicinais.or(old.plantas_medicinais),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct SocioDemografico {
    pub escolaridade: Option<String>,
    pub ocupacao: Option<String>,
    pub situacao_mercado_trabalho: Option<String>,
    pub possui_plano_saude_privado: Option<bool>,
    pub possui_deficiencia: Option<bool>,
}

impl SocioDemografico {
    pub fn merge(self, old: Self) -> Self {
        Self {
            escolaridade: self.escolaridade.or(old.escolaridade),
            ocupacao: self.ocupacao.or(old.ocupacao),
            situacao_mercado_trabalho: self
                .situacao_mercado_trabalho
                .or(old.situacao_mercado_trabalho),
            possui_plano_saude_privado: self
                .possui_plano_saude_privado
                .or(old.possui_plano_saude_privado),
            possui_deficiencia: self.possui_deficiencia.or(old.possui_deficiencia),
        }
    }
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

impl Patient {
    pub fn merge(self, old: Patient) -> Self {
        Self {
            // O "self" é o dado novo extraído, o "old" é o que estava no Banco.
            // A lógica `self.campo.or(old.campo)` significa:
            // "Se o dado novo tiver o valor, use-o. Se o dado novo for vazio, aproveite o antigo."
            id: self.id.or(old.id),
            name: self.name.or(old.name),
            sex: self.sex.or(old.sex),
            gender_identity: self.gender_identity.or(old.gender_identity),
            age: self.age.or(old.age),
            cpf: self.cpf.or(old.cpf),
            cns: self.cns.or(old.cns),
            mother_name: self.mother_name.or(old.mother_name),
            telefone_celular: self.telefone_celular.or(old.telefone_celular),
            raca_cor: self.raca_cor.or(old.raca_cor),
            cod_cipa: self.cod_cipa.or(old.cod_cipa),
            ultima_dum: self.ultima_dum.or(old.ultima_dum),
            idade_gestacional_dias: self.idade_gestacional_dias.or(old.idade_gestacional_dias),
            session_info: self.session_info.or(old.session_info),

            // Tratamento especial pros módulos aninhados
            condicoes_saude: match (self.condicoes_saude, old.condicoes_saude) {
                (Some(new_cs), Some(old_cs)) => Some(new_cs.merge(old_cs)),
                (Some(new_cs), None) => Some(new_cs),
                (None, Some(old_cs)) => Some(old_cs),
                (None, None) => None,
            },
            sociodemografico: match (self.sociodemografico, old.sociodemografico) {
                (Some(new_sd), Some(old_sd)) => Some(new_sd.merge(old_sd)),
                (Some(new_sd), None) => Some(new_sd),
                (None, Some(old_sd)) => Some(old_sd),
                (None, None) => None,
            },
        }
    }
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
