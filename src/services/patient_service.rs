use crate::domain::patient::Patient;
use crate::domain::pregnancy_rules::PregnancyRules;
use crate::services::traits::{PatientDataExtractor, PatientRepository};

/// Caso de Uso: Responsável por extrair, validar elegibilidade obstétrica, mesclar e salvar os dados do paciente
pub struct PatientService<E: PatientDataExtractor, R: PatientRepository> {
    extractor: E,
    repo: R,
}

impl<E: PatientDataExtractor, R: PatientRepository> PatientService<E, R> {
    pub fn new(extractor: E, repo: R) -> Self {
        Self { extractor, repo }
    }

    pub async fn process_and_get_patient(&self) -> Result<Option<Patient>, String> {
        // 1. Extrai o "Snapshot" atual da tela / GraphQL
        let extracted = self.extractor.extract()?;

        // 2. Define a chave de busca (CPF priorizado, senão ID interno)
        let key = extracted.cpf.clone().or_else(|| extracted.id.clone());

        if let Some(k) = key {
            // 3. Tenta buscar o histórico dele no Banco Local
            let existing_patient = self.repo.get_patient(&k).await?;

            // 4. Faz o Merge (Mantém o que já tínhamos + Atualiza o que veio de novo)
            let merged_patient = match existing_patient {
                Some(old_data) => extracted.merge(old_data),
                None => extracted,
            };

            // 5. Motor de Regras Clínicas (Elegibilidade)
            // Se a paciente NÃO atende aos critérios gestacionais, nós:
            // a) Não salvamos/poluímos o banco de dados.
            // b) Retornamos "None" para o UI, indicando que não há estratificação para ela.
            if !PregnancyRules::is_pregnant(&merged_patient) {
                return Ok(None);
            }

            // 6. Sendo elegível (Gestante), salva o resultado mesclado de volta no Banco Local
            self.repo.save_patient(&k, merged_patient.clone()).await?;

            Ok(Some(merged_patient))
        } else {
            // Sem chave primária, não podemos salvar nem buscar histórico.
            // Validamos apenas o snapshot isolado lido agora.
            if PregnancyRules::is_pregnant(&extracted) {
                Ok(Some(extracted))
            } else {
                Ok(None)
            }
        }
    }
}
