use crate::domain::patient::Patient;

/// Define o contrato para extração de dados do paciente.
/// A infraestrutura deve implementar essa trait garantindo o isolamento
/// das regras da aplicação das bibliotecas de UI/DOM.
pub trait PatientDataExtractor {
    fn extract(&self) -> Result<Patient, String>;
}
