use crate::domain::patient::Patient;
use crate::services::traits::PatientDataExtractor;

/// Caso de Uso: Responsável por gerenciar os dados do paciente
pub struct PatientService<E: PatientDataExtractor> {
    extractor: E,
}

impl<E: PatientDataExtractor> PatientService<E> {
    pub fn new(extractor: E) -> Self {
        Self { extractor }
    }

    pub fn get_patient_data(&self) -> Result<Patient, String> {
        // No futuro, podemos adicionar regras de negócio aqui,
        // como validação de CNS, cálculos de idade baseados na data de nascimento, etc.
        self.extractor.extract()
    }
}
