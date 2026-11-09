/**
 * input_risk_data.js
 * Renderiza o cartão de inputs de risco complementares com 2 colunas e 2 linhas
 * de campos selecionáveis (select/option) posicionado acima dos acordeões de avaliação.
 */

const InputRiskDataTemplate = (function () {
    function inputCard() {
        return `
            <div class="esus-input-card" style="background-color: #FFFFFF; border: 1px solid #E0E0E0; border-radius: 6px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);">
                <!-- Título e Subtítulo -->
                <div style="margin-bottom: 14px;">
                    <h3 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #000000ff;">Sorologias</h3>
                    <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #666;">Registre o resultado mais recente de cada exame.</p>
                </div>

                <!-- Grid de 2 colunas e 2 linhas -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <!-- Linha 1, Coluna 1 -->
                    <div>
                        <label for="esus-calc-medicacao" style="display: block; font-size: 0.75rem; font-weight: 500; color: #555; margin-bottom: 4px;">HIV</label>
                        <select id="esus-calc-medicacao" class="esus-select" style="width: 100%; padding: 8px 10px; border: 1px solid #D0D5DD; border-radius: 4px; font-size: 0.8rem; background-color: #FAFAFA; color: #333; cursor: pointer; outline: none; transition: border-color 0.2s;">
                            <option value="">Selecione...</option>
                            <option value="nao">Não faz uso</option>
                            <option value="continuo">Uso contínuo (sem risco teratogênico)</option>
                            <option value="teratogenico">Uso de medicamento teratogênico</option>
                        </select>
                    </div>

                    <!-- Linha 1, Coluna 2 -->
                    <div>
                        <label for="esus-calc-historico-familiar" style="display: block; font-size: 0.75rem; font-weight: 500; color: #555; margin-bottom: 4px;">HBsAg</label>
                        <select id="esus-calc-historico-familiar" class="esus-select" style="width: 100%; padding: 8px 10px; border: 1px solid #D0D5DD; border-radius: 4px; font-size: 0.8rem; background-color: #FAFAFA; color: #333; cursor: pointer; outline: none; transition: border-color 0.2s;">
                            <option value="">Selecione...</option>
                            <option value="nao">Não possui</option>
                            <option value="hipertensao_diabetes">Hipertensão / Diabetes</option>
                            <option value="cronica_grave">Doença crônica grave / genética</option>
                        </select>
                    </div>

                    <!-- Linha 2, Coluna 1 -->
                    <div>
                        <label for="esus-calc-sexo" style="display: block; font-size: 0.75rem; font-weight: 500; color: #555; margin-bottom: 4px;">Anti-HCV</label>
                        <select id="esus-calc-sexo" class="esus-select" style="width: 100%; padding: 8px 10px; border: 1px solid #D0D5DD; border-radius: 4px; font-size: 0.8rem; background-color: #FAFAFA; color: #333; cursor: pointer; outline: none; transition: border-color 0.2s;">
                            <option value="">Selecione...</option>
                            <option value="feminino">Feminino</option>
                            <option value="masculino_trans">Masculino (Homem trans)</option>
                        </select>
                    </div>

                    <!-- Linha 2, Coluna 2 -->
                    <div>
                        <label for="esus-calc-paridade" style="display: block; font-size: 0.75rem; font-weight: 500; color: #555; margin-bottom: 4px;">VDRL</label>
                        <select id="esus-calc-paridade" class="esus-select" style="width: 100%; padding: 8px 10px; border: 1px solid #D0D5DD; border-radius: 4px; font-size: 0.8rem; background-color: #FAFAFA; color: #333; cursor: pointer; outline: none; transition: border-color 0.2s;">
                            <option value="">Selecione...</option>
                            <option value="nulipara">Nulípara (1ª gestação)</option>
                            <option value="multipara">Multípara (1 a 4 partos)</option>
                            <option value="grande_multipara">Multiparidade extrema (≥5 partos)</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
    }

    function initEvents(container) {
        const selects = container.querySelectorAll('.esus-input-card select');
        selects.forEach(select => {
            select.addEventListener('change', (e) => {
                console.log(`[e-SUS Lens] Input alterado [${e.target.id}]:`, e.target.value);
            });
        });
    }

    return {
        inputCard,
        initEvents
    };
})();
