use crate::domain::patient::Patient;

/// Define o contrato para extração de dados do paciente.
pub trait PatientDataExtractor {
    fn extract(&self) -> Result<Patient, String>;
}

/// Define o contrato para persistência local (IndexedDB)
pub trait PatientRepository {
    // Usamos Box<dyn std::future::Future> para evitar problemas de trait async sem a crate async_trait
    fn save_patient(
        &self,
        key: &str,
        patient: Patient,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<(), String>> + '_>>;
    fn get_patient(
        &self,
        key: &str,
    ) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Option<Patient>, String>> + '_>>;
}
