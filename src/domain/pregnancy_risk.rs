use crate::domain::patient::Patient;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum GrauRisco {
    Habitual,
    Potencial,
    Alto,
}

impl Default for GrauRisco {
    fn default() -> Self {
        GrauRisco::Habitual
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct FatorRiscoIdentificado {
    pub categoria: String, // "Morbidade Prévia", "Fator Sociodemográfico", "Diagnóstico Obstétrico"
    pub descricao: String,
    pub gravidade: String, // "Alto" ou "Potencial"
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct EstratificacaoRiscoResult {
    pub grau: GrauRisco,
    pub rotulo: String, // "Risco Habitual", "Risco Potencial / Intermediário", "Alto Risco Obstétrico"
    pub cor: String,    // "#4CAF50", "#FFA000", "#D32F2F"
    pub fatores: Vec<FatorRiscoIdentificado>,
    pub conduta_recomendada: String,
}

pub struct PregnancyRiskEvaluator;

impl PregnancyRiskEvaluator {
    /// Extrai a idade numérica a partir do campo age (ex: "36", "36 anos", ou "15/03/1988")
    fn extrair_idade_anos(age_str: Option<&str>) -> Option<u32> {
        let text = age_str?.trim();
        // Se for data DD/MM/AAAA, calcula aproximado considerando ano atual
        if let Some(pos) = text.rfind('/') {
            if text.len() >= pos + 5 {
                if let Ok(ano_nasc) = text[pos + 1..pos + 5].parse::<i32>() {
                    let ano_atual = 2026; // data de referência do sistema
                    if ano_nasc > 1900 && ano_nasc <= ano_atual {
                        return Some((ano_atual - ano_nasc) as u32);
                    }
                }
            }
        }

        // Se for string numérica direta ("36" ou "36 anos")
        let digits: String = text.chars().take_while(|c| c.is_ascii_digit()).collect();
        digits.parse::<u32>().ok()
    }

    /// Executa a estratificação clínica oficial segundo o Manual de Gestação de Alto Risco do MS
    pub fn avaliar(patient: &Patient) -> EstratificacaoRiscoResult {
        let mut fatores: Vec<FatorRiscoIdentificado> = Vec::new();

        // 1. FATORES DE ALTO RISCO (Condições Clínicas Crônicas e Morbidades do Cadastro Individual)
        if let Some(cs) = &patient.condicoes_saude {
            if cs.hipertensao_arterial == Some(true) {
                fatores.push(FatorRiscoIdentificado {
                    categoria: "Morbidade Prévia".to_string(),
                    descricao: "Hipertensão Arterial Sistêmica Crônica".to_string(),
                    gravidade: "Alto".to_string(),
                });
            }
            if cs.diabetes == Some(true) {
                fatores.push(FatorRiscoIdentificado {
                    categoria: "Morbidade Prévia".to_string(),
                    descricao: "Diabetes Mellitus Pré-gestacional / Crônico".to_string(),
                    gravidade: "Alto".to_string(),
                });
            }
            if cs.doenca_cardiaca == Some(true) {
                fatores.push(FatorRiscoIdentificado {
                    categoria: "Morbidade Prévia".to_string(),
                    descricao: "Cardiopatia Materna".to_string(),
                    gravidade: "Alto".to_string(),
                });
            }
            if cs.problema_rins == Some(true) {
                fatores.push(FatorRiscoIdentificado {
                    categoria: "Morbidade Prévia".to_string(),
                    descricao: "Nefropatia / Doença Renal Crônica".to_string(),
                    gravidade: "Alto".to_string(),
                });
            }
            if cs.tuberculose == Some(true) {
                fatores.push(FatorRiscoIdentificado {
                    categoria: "Doença Infecciosa".to_string(),
                    descricao: "Tuberculose ativa ou em tratamento".to_string(),
                    gravidade: "Alto".to_string(),
                });
            }
            if cs.hanseniase == Some(true) {
                fatores.push(FatorRiscoIdentificado {
                    categoria: "Doença Infecciosa".to_string(),
                    descricao: "Hanseníase".to_string(),
                    gravidade: "Alto".to_string(),
                });
            }
            if cs.cancer == Some(true) {
                fatores.push(FatorRiscoIdentificado {
                    categoria: "Morbidade Prévia".to_string(),
                    descricao: "Neoplasia / Câncer".to_string(),
                    gravidade: "Alto".to_string(),
                });
            }

            // Fatores de Risco Potencial / Intermediário (Estilo de vida e uso de substâncias)
            if cs.fumante == Some(true) {
                fatores.push(FatorRiscoIdentificado {
                    categoria: "Hábito de Vida".to_string(),
                    descricao: "Tabagismo ativo na gestação".to_string(),
                    gravidade: "Potencial".to_string(),
                });
            }
            if cs.uso_alcool == Some(true) {
                fatores.push(FatorRiscoIdentificado {
                    categoria: "Hábito de Vida".to_string(),
                    descricao: "Consumo de bebidas alcoólicas".to_string(),
                    gravidade: "Potencial".to_string(),
                });
            }
            if cs.uso_drogas == Some(true) {
                fatores.push(FatorRiscoIdentificado {
                    categoria: "Hábito de Vida".to_string(),
                    descricao: "Uso de substâncias psicoativas".to_string(),
                    gravidade: "Potencial".to_string(),
                });
            }
        }

        // 2. IDADE MATERNA EXTREMA
        if let Some(idade) = Self::extrair_idade_anos(patient.age.as_deref()) {
            if idade < 15 {
                fatores.push(FatorRiscoIdentificado {
                    categoria: "Fator Sociodemográfico".to_string(),
                    descricao: format!("Idade materna muito jovem ({} anos < 15 anos)", idade),
                    gravidade: "Alto".to_string(),
                });
            } else if idade >= 35 {
                fatores.push(FatorRiscoIdentificado {
                    categoria: "Fator Sociodemográfico".to_string(),
                    descricao: format!("Idade materna avançada ({} anos ≥ 35 anos)", idade),
                    gravidade: "Potencial".to_string(),
                });
            }
        }

        // 3. CÓDIGOS CLÍNICOS E DIAGNÓSTICOS DO ATENDIMENTO (CIAP-2 / CID-10)
        let cod_cipa_upper = patient.cod_cipa.as_deref().unwrap_or("").to_uppercase();
        let problema_upper = patient
            .evolucao_pre_natal
            .as_ref()
            .and_then(|e| e.problema.as_deref())
            .unwrap_or("")
            .to_uppercase();

        let diagnosticos = format!("{} {}", cod_cipa_upper, problema_upper);

        if diagnosticos.contains("W84") || diagnosticos.contains("Z35") {
            fatores.push(FatorRiscoIdentificado {
                categoria: "Diagnóstico Clínico".to_string(),
                descricao: "Gravidez de alto risco identificada (CIAP W84 ou CID Z35)".to_string(),
                gravidade: "Alto".to_string(),
            });
        }

        // CIDs do Capítulo XV com complicação expressa (Pré-eclâmpsia O14, Diabetes gestacional O24, Hemorragias)
        if diagnosticos.contains("O14")
            || diagnosticos.contains("PRÉ-ECLÂMPSIA")
            || diagnosticos.contains("PRE-ECLAMPSIA")
        {
            fatores.push(FatorRiscoIdentificado {
                categoria: "Intercorrência Obstétrica".to_string(),
                descricao: "Pré-eclâmpsia / Síndrome Hipertensiva Específica da Gestação"
                    .to_string(),
                gravidade: "Alto".to_string(),
            });
        }
        if diagnosticos.contains("O24") || diagnosticos.contains("DIABETES") {
            if !fatores.iter().any(|f| f.descricao.contains("Diabetes")) {
                fatores.push(FatorRiscoIdentificado {
                    categoria: "Intercorrência Obstétrica".to_string(),
                    descricao: "Diabetes Mellitus Gestacional".to_string(),
                    gravidade: "Alto".to_string(),
                });
            }
        }
        if diagnosticos.contains("O00")
            || diagnosticos.contains("GRAVIDEZ ABDOMINAL")
            || diagnosticos.contains("ECTÓPICA")
        {
            fatores.push(FatorRiscoIdentificado {
                categoria: "Intercorrência Obstétrica Grave".to_string(),
                descricao: "Suspeita ou diagnóstico de gravidez ectópica/abdominal".to_string(),
                gravidade: "Alto".to_string(),
            });
        }

        // 4. CONSOLIDAÇÃO DO GRAU DE RISCO
        let tem_alto_risco = fatores.iter().any(|f| f.gravidade == "Alto");
        let tem_potencial_risco = fatores.iter().any(|f| f.gravidade == "Potencial");

        if tem_alto_risco {
            EstratificacaoRiscoResult {
                grau: GrauRisco::Alto,
                rotulo: "ALTO RISCO OBSTÉTRICO".to_string(),
                cor: "#D32F2F".to_string(),
                fatores,
                conduta_recomendada: "Vincular à maternidade de referência e agendar consulta especializada no pré-natal de alto risco (atenção secundária). Manter cuidado compartilhado com a UBS.".to_string(),
            }
        } else if tem_potencial_risco {
            EstratificacaoRiscoResult {
                grau: GrauRisco::Potencial,
                rotulo: "RISCO POTENCIAL / INTERMEDIÁRIO".to_string(),
                cor: "#FFA000".to_string(),
                fatores,
                conduta_recomendada: "Acompanhamento rigoroso pela equipe da Atenção Primária à Saúde (APS) com menor intervalo entre consultas e monitoramento constante de queixas e sinais vitais.".to_string(),
            }
        } else {
            EstratificacaoRiscoResult {
                grau: GrauRisco::Habitual,
                rotulo: "RISCO HABITUAL".to_string(),
                cor: "#4CAF50".to_string(),
                fatores,
                conduta_recomendada: "Acompanhamento pré-natal de rotina na Unidade Básica de Saúde pela equipe de Saúde da Família (médico e enfermeiro) conforme calendário do Ministério da Saúde.".to_string(),
            }
        }
    }
}
