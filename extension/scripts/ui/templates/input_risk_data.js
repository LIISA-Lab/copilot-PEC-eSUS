/**
 * input_risk_data.js
 * Renderiza os cartões de parâmetros clínicos complementares:
 * - inputSelectCard: Sorologias (HIV, HBsAg, Anti-HCV, VDRL)
 * - inputCard: Sinais vitais e exames (PA Sistólica, PA Diastólica, Peso, Hemoglobina)
 *
 * Todos os valores são armazenados no LensStore para cálculos e utilidades (IMC, PAM, estratificação).
 */

const InputRiskDataTemplate = (function () {
    /**
     * Cartão de Sorologias (Selects 2x2)
     */
    function inputSelectCard() {
        const sorologias = (typeof LensStore !== 'undefined' && LensStore.getSorologias)
            ? LensStore.getSorologias()
            : {};

        const renderOption = (selectedVal, value, label) => `
            <option value="${value}" ${selectedVal === value ? 'selected' : ''}>${label}</option>
        `;

        const optionsHtml = (selectedVal) => `
            <option value="">Selecione...</option>
            ${renderOption(selectedVal, 'nao_reagente', 'Não Reagente')}
            ${renderOption(selectedVal, 'reagente', 'Reagente')}
            ${renderOption(selectedVal, 'indeterminado', 'Indeterminado')}
            ${renderOption(selectedVal, 'nao_realizado', 'Não Realizado')}
        `;

        return `
            <div class="esus-input-card">
                <!-- Título e Subtítulo -->
                <div style="margin-bottom: 14px;">
                    <h3 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #111;">Sorologias</h3>
                    <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #666;">Registre o resultado mais recente de cada exame.</p>
                </div>

                <!-- Grid de 2 colunas e 2 linhas -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <!-- Linha 1, Coluna 1 -->
                    <div>
                        <label for="esus-sorologia-hiv" style="display: block; font-size: 0.75rem; font-weight: 500; color: #555; margin-bottom: 4px;">HIV</label>
                        <select id="esus-sorologia-hiv" class="esus-select esus-sorologia-select" data-key="hiv">
                            ${optionsHtml(sorologias.hiv || '')}
                        </select>
                    </div>

                    <!-- Linha 1, Coluna 2 -->
                    <div>
                        <label for="esus-sorologia-hbsag" style="display: block; font-size: 0.75rem; font-weight: 500; color: #555; margin-bottom: 4px;">HBsAg (Hepatite B)</label>
                        <select id="esus-sorologia-hbsag" class="esus-select esus-sorologia-select" data-key="hbsag">
                            ${optionsHtml(sorologias.hbsag || '')}
                        </select>
                    </div>

                    <!-- Linha 2, Coluna 1 -->
                    <div>
                        <label for="esus-sorologia-anti-hcv" style="display: block; font-size: 0.75rem; font-weight: 500; color: #555; margin-bottom: 4px;">Anti-HCV (Hepatite C)</label>
                        <select id="esus-sorologia-anti-hcv" class="esus-select esus-sorologia-select" data-key="antiHcv">
                            ${optionsHtml(sorologias.antiHcv || '')}
                        </select>
                    </div>

                    <!-- Linha 2, Coluna 2 -->
                    <div>
                        <label for="esus-sorologia-vdrl" style="display: block; font-size: 0.75rem; font-weight: 500; color: #555; margin-bottom: 4px;">VDRL (Sífilis)</label>
                        <select id="esus-sorologia-vdrl" class="esus-select esus-sorologia-select" data-key="vdrl">
                            ${optionsHtml(sorologias.vdrl || '')}
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Cartão de Registro Clínico com 4 inputs (PA Sistólica, PA Diastólica, Peso, Hemoglobina)
     */
    function inputCard() {
        const inputs = (typeof LensStore !== 'undefined' && LensStore.getClinicalInputs)
            ? LensStore.getClinicalInputs()
            : {};

        const paSistolica = inputs.paSistolica ?? '';
        const paDiastolica = inputs.paDiastolica ?? '';
        const peso = inputs.peso ?? '';
        const hemoglobina = inputs.hemoglobina ?? '';

        return `
            <div class="esus-input-card">
                <!-- Título e Subtítulo -->
                <div style="margin-bottom: 14px;">
                    <h3 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #111;">Registro Clínico</h3>
                    <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #666;">Sinais vitais e parâmetros laboratoriais da gestante</p>
                </div>

                <!-- Grid de 2 colunas e 2 linhas com os 4 inputs -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <!-- Linha 1, Coluna 1: PA Sistólica -->
                    <div>
                        <label for="esus-input-pa-sistolica" style="display: block; font-size: 0.75rem; font-weight: 500; color: #555; margin-bottom: 4px;">PA sistólica</label>
                        <input 
                            id="esus-input-pa-sistolica" 
                            type="number" 
                            step="1"
                            min="40" 
                            max="300"
                            placeholder="mmHg" 
                            class="esus-input esus-clinical-input" 
                            data-key="paSistolica" 
                            value="${paSistolica}">
                    </div>

                    <!-- Linha 1, Coluna 2: PA Diastólica -->
                    <div>
                        <label for="esus-input-pa-diastolica" style="display: block; font-size: 0.75rem; font-weight: 500; color: #555; margin-bottom: 4px;">PA diastólica</label>
                        <input 
                            id="esus-input-pa-diastolica" 
                            type="number" 
                            step="1"
                            min="20" 
                            max="200"
                            placeholder="mmHg" 
                            class="esus-input esus-clinical-input" 
                            data-key="paDiastolica" 
                            value="${paDiastolica}">
                    </div>

                    <!-- Linha 2, Coluna 1: Peso -->
                    <div>
                        <label for="esus-input-peso" style="display: block; font-size: 0.75rem; font-weight: 500; color: #555; margin-bottom: 4px;">Peso</label>
                        <input 
                            id="esus-input-peso" 
                            type="number" 
                            step="0.1" 
                            min="20" 
                            max="300"
                            placeholder="kg" 
                            class="esus-input esus-clinical-input" 
                            data-key="peso" 
                            value="${peso}">
                    </div>

                    <!-- Linha 2, Coluna 2: Hemoglobina -->
                    <div>
                        <label for="esus-input-hemoglobina" style="display: block; font-size: 0.75rem; font-weight: 500; color: #555; margin-bottom: 4px;">Hemoglobina</label>
                        <input 
                            id="esus-input-hemoglobina" 
                            type="number" 
                            step="0.1" 
                            min="2" 
                            max="25"
                            placeholder="g/dL" 
                            class="esus-input esus-clinical-input" 
                            data-key="hemoglobina" 
                            value="${hemoglobina}">
                    </div>
                </div>

                <!-- Painel de Utilidades e Indicadores Calculados -->
                <div id="esus-clinical-indicators" style="margin-top: 12px; padding-top: 10px; border-top: 1px solid #F0F0F0; display: flex; flex-wrap: wrap; gap: 8px; font-size: 0.75rem;">
                    ${renderIndicatorsHtml()}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza badges e cálculos dinâmicos baseados no LensStore (PAM, Anemia, IMC, Hipertensão)
     */
    function renderIndicatorsHtml() {
        if (typeof LensStore === 'undefined') return '';

        const inputs = LensStore.getClinicalInputs();
        const alerts = LensStore.getClinicalAlerts ? LensStore.getClinicalAlerts() : {};
        const badges = [];

        // Pressão Arterial Média (PAM)
        const pam = LensStore.calculatePAM ? LensStore.calculatePAM() : null;
        if (pam) {
            const isHigh = alerts.isHypertensive;
            badges.push(`
                <span style="padding: 3px 8px; border-radius: 4px; font-weight: 500; background-color: ${isHigh ? '#FFEBEE' : '#E8F5E9'}; color: ${isHigh ? '#C62828' : '#2E7D32'};">
                    PAM: ${pam} mmHg ${isHigh ? '⚠️ Alerta PA (≥140/90)' : ''}
                </span>
            `);
        }

        // Anemia por Hemoglobina (< 11 g/dL na gestação)
        if (inputs.hemoglobina) {
            if (alerts.hasSevereAnemia) {
                badges.push(`
                    <span style="padding: 3px 8px; border-radius: 4px; font-weight: 600; background-color: #FFEBEE; color: #C62828;">
                        🚨 Anemia Grave (Hb < 8 g/dL)
                    </span>
                `);
            } else if (alerts.hasAnemia) {
                badges.push(`
                    <span style="padding: 3px 8px; border-radius: 4px; font-weight: 500; background-color: #FFF3E0; color: #E65100;">
                        ⚠️ Anemia Gestacional (Hb < 11 g/dL)
                    </span>
                `);
            } else {
                badges.push(`
                    <span style="padding: 3px 8px; border-radius: 4px; font-weight: 500; background-color: #E8F5E9; color: #2E7D32;">
                        Hb Normal (≥ 11 g/dL)
                    </span>
                `);
            }
        }

        // Cálculo de IMC (se peso estiver preenchido e altura disponível)
        const imc = LensStore.calculateIMC ? LensStore.calculateIMC() : null;
        if (imc) {
            badges.push(`
                <span style="padding: 3px 8px; border-radius: 4px; font-weight: 500; background-color: #E3F2FD; color: #1565C0;">
                    IMC: ${imc} kg/m²
                </span>
            `);
        }

        return badges.join('') || '<span style="color: #999; font-size: 0.7rem;">Preencha os valores para calcular indicadores automáticos (PAM, Alertas de PA, Anemia, IMC).</span>';
    }

    /**
     * Atualiza os indicadores calculados em tempo real na interface
     */
    function updateIndicators(container) {
        const indEl = container.querySelector('#esus-clinical-indicators');
        if (indEl) {
            indEl.innerHTML = renderIndicatorsHtml();
        }
    }

    /**
     * Vincula listeners de evento nos inputs e selects
     */
    function initEvents(container) {
        if (!container) return;

        // 1. Inputs numéricos clínicos (PA Sistólica, PA Diastólica, Peso, Hemoglobina)
        const clinicalInputs = container.querySelectorAll('.esus-clinical-input');
        clinicalInputs.forEach(input => {
            const handleUpdate = (e) => {
                const key = e.target.getAttribute('data-key');
                const rawVal = e.target.value.trim();
                const val = rawVal !== '' ? parseFloat(rawVal) : null;

                if (key && typeof LensStore !== 'undefined') {
                    LensStore.setClinicalInput(key, val);
                    updateIndicators(container);
                    console.log(`[e-SUS Lens] Clinical input [${key}] atualizado:`, val, LensStore.getClinicalInputs());
                }
            };

            input.addEventListener('input', handleUpdate);
            input.addEventListener('change', handleUpdate);
        });

        // 2. Selects de Sorologias (HIV, HBsAg, Anti-HCV, VDRL)
        const sorologiaSelects = container.querySelectorAll('.esus-sorologia-select');
        sorologiaSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                const key = e.target.getAttribute('data-key');
                const val = e.target.value;

                if (key && typeof LensStore !== 'undefined') {
                    LensStore.setSorologia(key, val);
                    console.log(`[e-SUS Lens] Sorologia [${key}] atualizada:`, val, LensStore.getSorologias());
                }
            });
        });
    }

    return {
        inputSelectCard,
        inputCard,
        initEvents,
        renderIndicatorsHtml
    };
})();
