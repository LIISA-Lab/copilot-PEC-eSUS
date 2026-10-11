use crate::domain::patient::Patient;

/// Engine de Regras de Elegibilidade Obstétrica
/// Responsável por determinar se um paciente está em contexto gestacional
pub struct PregnancyRules;

impl PregnancyRules {
    /// Códigos CIAP-2 relacionados à gestação
    const PREGNANCY_CIAPS: &'static [&'static str] = &[
        "W78", // Gravidez
        "W79", // Gravidez não confirmada
        "W84", // Gravidez de alto risco
        "W71", // Infecções na gravidez
    ];

    /// Códigos CID-10 relacionados à gestação
    const PREGNANCY_CIDS: &'static [&'static str] = &[
        "Z34", // Supervisão de gravidez normal
        "Z35", // Supervisão de gravidez de alto risco
    ];

    /// Verifica se o código informado começa com a letra 'O' e é seguido por números,
    /// cobrindo todo o Capítulo XV do CID-10 (O00 - O99).
    fn is_cid_chapter_o(code: &str) -> bool {
        let code = code.trim().to_uppercase();
        if code.starts_with('O') && code.len() >= 3 {
            // Verifica se os caracteres após o 'O' são numéricos (ex: O00, O99)
            let numeric_part = &code[1..3];
            numeric_part.chars().all(|c| c.is_ascii_digit())
        } else {
            false
        }
    }

    /// Executa a validação cruzada para determinar se a paciente é elegível.
    pub fn is_pregnant(patient: &Patient) -> bool {
        // 1. Regra de Auto-declaração (Cadastro Individual)
        if let Some(condicoes) = &patient.condicoes_saude {
            if condicoes.gestante == Some(true) {
                return true;
            }
        }

        // 2. Regra de DUM (Se tem Data de Última Menstruação preenchida via módulo obstétrico)
        if patient.ultima_dum.is_some() || patient.idade_gestacional_dias.is_some() {
            return true;
        }

        // 3. Regra de Códigos Clínicos (CIAP/CID do Atendimento ou Histórico)
        if let Some(cipa) = &patient.cod_cipa {
            let cipa_upper = cipa.to_uppercase();

            // Checa CIAPs exatos
            for &code in Self::PREGNANCY_CIAPS {
                if cipa_upper.contains(code) {
                    return true;
                }
            }

            // Checa CIDs exatos
            for &code in Self::PREGNANCY_CIDS {
                if cipa_upper.contains(code) {
                    return true;
                }
            }

            // Checa a família CID O00-O99
            // Exemplo de payload do eSUS: "O244 - Diabetes mellitus que surge na gravidez"
            // Dividimos por '-' ou espaço e checamos o primeiro bloco
            if let Some(first_word) = cipa_upper.split(|c: char| !c.is_alphanumeric()).next() {
                 if Self::is_cid_chapter_o(first_word) {
                     return true;
                 }
            }
        }

        // Se falhou em todos os testes, não consideramos em contexto gestacional
        false
    }
}
