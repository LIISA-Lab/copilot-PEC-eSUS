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
            let mut merged_patient = match existing_patient {
                Some(old_data) => extracted.merge(old_data),
                None => extracted,
            };

            // 5. Avalia elegibilidade obstétrica
            let is_pregnant = PregnancyRules::is_pregnant(&merged_patient);
            merged_patient.is_pregnant = Some(is_pregnant);

            // 6. Política de Persistência:
            // Apenas pacientes gestantes são salvos/cacheados no IndexedDB para futura sincronização HIE
            if is_pregnant {
                self.repo.save_patient(&k, merged_patient.clone()).await?;
            }

            // Sempre retorna o paciente (gestante ou não) para possibilitar
            // o tutelamento no Acesso Saúde CE para qualquer cidadão
            Ok(Some(merged_patient))
        } else {
            // Sem chave primária identificada
            let mut patient = extracted;
            let is_pregnant = PregnancyRules::is_pregnant(&patient);
            patient.is_pregnant = Some(is_pregnant);
            Ok(Some(patient))
        }
    }
}
