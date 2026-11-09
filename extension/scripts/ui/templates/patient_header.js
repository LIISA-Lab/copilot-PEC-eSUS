/**
 * patient_header.js
 * Renderiza o cabeçalho superior e o cartão fixo de identificação do paciente da sidebar.
 */

const PatientHeaderTemplate = (() => {
    function renderTopHeader() {
        const version = chrome.runtime?.getManifest?.()?.version || "0.3.0";
        return `
            <div style="background-color: #1351b4; color: white; padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #f8d117;">
                <div style="display: flex; flex-direction: column; width: 100%">
                    <h2 style="margin: 0; font-size: 1.1rem; font-weight: 500; display: flex; align-items: center; gap: 8px">
                        e-SUS Lens Gestante
                    </h2>
                    <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; margin-top: 2px">
                        <span style="font-size: 1rem; color: #b3cde0; margin-top: 2px;">Estratificação de Risco</span>
                        <span style="font-size: 0.7rem; color: #b3cde0; margin-top: 4px; margin-right: 8px; font-family: monospace;">v${version}</span>
                    </div>
                </div>
                <button id="esus-lens-close" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; padding: 4px;" title="Minimizar">✖</button>
            </div>
        `;
    }

    function renderTabsNavigation(isPregnant) {
        if (isPregnant) {
            return `
                <div style="display: flex; background: #fff; border-bottom: 1px solid #ccc;">
                    <button class="esus-tab active" data-tab="tab-geral">Gestante</button>
                    <button class="esus-tab" data-tab="tab-socio">Avaliação</button>
                    <button class="esus-tab" data-tab="tab-saude">Classificação</button>
                    <button class="esus-tab" data-tab="tab-acesso-saude">Acesso Saúde CE</button>
                </div>
            `;
        }

        return `
            <div style="display: flex; background: #fff; border-bottom: 1px solid #ccc;">
                <button class="esus-tab active" data-tab="tab-acesso-saude" style="color: #1351b4; border-bottom: 3px solid #1351b4; background-color: #F8F9FA;">Acesso Saúde CE (Teleconsultoria)</button>
            </div>
        `;
    }

    function renderPatientSummaryCard(data, isVisible = true) {
        return `
            <div id="esus-patient-header" style="padding: 16px; background-color: #F8FAFC; border-bottom: 1px solid #E0E0E0; position: sticky; top: 0; z-index: 10; display: ${isVisible ? 'block' : 'none'};">
                <!-- Alerta de Identificação -->
                <div style="background-color: #E8F5E9; padding: 6px 16px; border-radius: 4px; margin-bottom: 16px; display: flex; align-items: center; max-width: 220px;">
                    <h3 style="margin: 0; color: #000000ff; font-size: 0.75rem; font-weight: 600;">
                        <span style="width: 12px; height: 12px; background-color: #4CAF50; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>Gestante em Monitoramento
                    </h3>
                </div>

                <!-- Cartão de Paciente -->
                <div style="background-color: #FFFFFF; border: 1px solid #E0E0E0; border-radius: 6px; padding: 12px 16px; margin-bottom: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="margin-bottom: 8px; display: flex; flex-direction: row; align-items: center;">
                        <h3 style="margin: 0 8px 0 0; font-size: 0.95rem; font-weight: 600; color: #333;">
                            ${data.name || 'Paciente sem identificação'}
                        </h3>
                        <p style="margin: 0; font-size: 0.75rem; font-weight: 200; color: #666;">
                            <strong>${data.age || 'Idade não informada'}</strong>
                        </p>
                    </div>
                    <div style="background-color: #FFF3CD; border: 1px solid #FFC107; padding: 8px 12px; border-radius: 3px;">
                        <div style="display: flex; align-items: center; margin-bottom: 4px;">
                            <p style="margin: 0; font-size: 1rem; background-color: #FFC107; padding: 0.5rem; border-radius: 4px; color: #FFD230; font-weight: 600; margin-right: 8px;">
                                ⚠️ 
                            </p>
                            <div style="margin-bottom: 4px; display: flex; flex-direction: column;">
                                <strong style="font-size: 10px; font-weight: 600;">CLASSIFICAÇÃO DE RISCO</strong> 
                                <strong style="font-size: 14px; font-weight: 700;">Risco Intermediário</strong>
                            </div>
                        </div>
                        <span style="font-size: 14px; font-weight: 200; color: #973C00;">Verifique os dados clínicos e sócio-demográficos antes de qualquer conduta.</span>
                    </div>
                </div>
            </div>
        `;
    }

    return {
        renderTopHeader,
        renderTabsNavigation,
        renderPatientSummaryCard
    };
})();

