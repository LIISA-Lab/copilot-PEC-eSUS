/**
 * tab_risk_accordion.js
 * Renderiza e gerencia os accordions de critérios clínicos e checkboxes na Aba de Avaliação.
 */

const RiskAccordionTemplate = (() => {
    function render(data) {
        let html = '';
        const criterios = RiskCriteria.getCriterios();

        Object.keys(criterios).forEach((criterioKey) => {
            const criterio = criterios[criterioKey];
            const selectedList = LensStore.getSelectedItems(criterioKey);
            const selectedCount = selectedList.length;
            const totalCount = criterio.items.length;

            html += `
                <details class="esus-accordion" style="margin-bottom: 12px;">
                    <summary style="padding: 12px 16px; font-weight: 600; color: #1351b4; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; background: #fafafa; border-bottom: 1px solid transparent;">
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #000000ff;">${criterio.title}</div>
                            <div style="font-size: 0.75rem; color: #888; margin-top: 2px;">${selectedCount} de ${totalCount} marcados</div>
                        </div>
                    </summary>

                    <div class="esus-accordion-content">
                        <div style="padding: 16px; background-color: #FFFFFF; border-top: 1px solid #E0E0E0;">
                            ${criterio.items.map((item, idx) => {
                const isChecked = selectedList.some(i => i.title === item.title);
                return `
                                    <label class="esus-avaliacao-item" data-criterio="${criterioKey}" data-index="${idx}" style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; padding: 12px; padding-bottom: 16px; border-bottom: 1px solid #F0F0F0; cursor: pointer; border-radius: 4px; transition: background-color 0.2s ease;">
                                        <!-- Checkbox -->
                                        <input type="checkbox" class="esus-avaliacao-checkbox" data-criterio="${criterioKey}" data-index="${idx}" ${isChecked ? 'checked' : ''} style="margin-top: 4px; cursor: pointer; width: 18px; height: 18px; flex-shrink: 0;">

                                        <!-- Conteúdo -->
                                        <div style="flex: 1;">
                                            <div style="font-weight: 500; color: #333; font-size: 0.9rem;">${item.title}</div>
                                            ${item.subtitle ? `<div style="font-size: 0.75rem; color: #888; margin-top: 2px;">${item.subtitle}</div>` : ''}
                                        </div>

                                        <!-- Badge -->
                                        <div style="padding: 4px 8px; border-radius: 3px; font-size: 0.7rem; font-weight: 600; white-space: nowrap; flex-shrink: 0; ${item.risk
                        ? 'background-color: #FEF2F2; color: #c62828;'
                        : 'background-color: #E8E8E8; color: #333;'
                    }">
                                            ${item.badge}
                                        </div>
                                    </label>
                                `;
            }).join('')}
                        </div>
                    </div>
                </details>
            `;
        });

        return html;
    }

    function renderUrgencias(data) {
        const urgenciasData = (typeof RiskCriteria !== 'undefined' && RiskCriteria.getSinaisUrgencia)
            ? RiskCriteria.getSinaisUrgencia()
            : (typeof SINAIS_URGENCIA !== 'undefined' ? SINAIS_URGENCIA : null);

        if (!urgenciasData) return '';

        const urgencia = urgenciasData.sinaisUrgencia;
        if (!urgencia) return '';

        const items = urgencia.itens || urgencia.items || [];
        const selectedUrgencias = (typeof LensStore !== 'undefined' && LensStore.getSelectedUrgencias)
            ? LensStore.getSelectedUrgencias()
            : [];

        // Ícone alert-3.svg embutido para renderização imediata com background vermelho
        const alertIconSvg = `
            <svg width="18" height="18" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.17627 4.82935V7.49506M7.17627 10.1608H7.18293" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" stroke="#C10007"/>
                <path d="M6.04342 1.23059L0.778632 10.8272C0.659531 11.0331 0.597733 11.2672 0.599653 11.5051C0.601573 11.7431 0.667141 11.9761 0.789551 12.1801C0.911961 12.3841 1.08675 12.5517 1.29577 12.6653C1.50479 12.779 1.74042 12.8346 1.9782 12.8265H12.3745C12.6123 12.8346 12.8479 12.779 13.0569 12.6653C13.266 12.5517 13.4407 12.3841 13.5632 12.1801C13.6856 11.9761 13.7511 11.7431 13.7531 11.5051C13.755 11.2672 13.6932 11.0331 13.5741 10.8272L8.30928 1.23059C8.18975 1.03771 8.02295 0.87854 7.82469 0.768163C7.62643 0.657786 7.40327 0.599854 7.17635 0.599854C6.94944 0.599854 6.72628 0.657786 6.52802 0.768163C6.32976 0.87854 6.16296 1.03771 6.04342 1.23059Z" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" stroke="#C10007"/>
            </svg>
        `;

        return `
            <details class="esus-accordion esus-accordion-urgencia" style="margin-bottom: 16px;">
                <summary>
                    <div style="display: flex; align-items: center; flex: 1;">
                        <!-- Ícone alert-3 com background vermelho -->
                        <div class="esus-urgencia-icon-container">
                            ${alertIconSvg}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: 600; color: #B42318; font-size: 0.95rem;">${urgencia.title}</div>
                            <div style="font-size: 0.75rem; color: #7A271A; margin-top: 2px;">${urgencia.subtitle || ''}</div>
                        </div>
                    </div>
                </summary>

                <div class="esus-accordion-content">
                    <div style="padding: 16px; background-color: #FFFFFF; border-top: 1px solid #FECDCA;">
                        ${items.map((item, idx) => {
            const isChecked = selectedUrgencias.some(i => i.title === item.title);
            return `
                                <label class="esus-urgencia-item" data-index="${idx}">
                                    <input type="checkbox" class="esus-urgencia-checkbox" data-index="${idx}" ${isChecked ? 'checked' : ''}>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 500; color: #333; font-size: 0.85rem; line-height: 1.3;">${item.title}</div>
                                    </div>
                                    <div style="padding: 3px 8px; border-radius: 3px; font-size: 0.65rem; font-weight: 700; white-space: nowrap; flex-shrink: 0; background-color: #FEE4E2; color: #B42318; border: 1px solid #FDA29B;">
                                        URGÊNCIA
                                    </div>
                                </label>
                            `;
        }).join('')}
                    </div>
                </div>
            </details>
        `;
    }

    function updateAccordionCounter(sidebar, criterioKey) {
        const selectedCount = LensStore.getSelectedItems(criterioKey).length;
        const totalCount = RiskCriteria.getCriterio(criterioKey).items.length;

        // Procura o accordion específico desse critério pela posição ou pelo label
        const items = sidebar.querySelectorAll(`.esus-avaliacao-checkbox[data-criterio="${criterioKey}"]`);
        if (items.length > 0) {
            const accordion = items[0].closest('.esus-accordion');
            if (accordion) {
                const summary = accordion.querySelector('summary');
                if (summary) {
                    const counterDiv = summary.querySelector('div:first-child > div:nth-child(2)');
                    if (counterDiv) {
                        counterDiv.textContent = `${selectedCount} de ${totalCount} marcados`;
                    }
                }
            }
        }
    }

    function initCheckboxes(sidebar) {
        const checkboxes = sidebar.querySelectorAll('.esus-avaliacao-checkbox');
        const items = sidebar.querySelectorAll('.esus-avaliacao-item');

        // Evento ao clicar no item inteiro
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.tagName.toLowerCase() === 'input') {
                    // Se o próprio checkbox foi clicado, deixa o evento nativo rodar
                    return;
                }
                e.preventDefault();
                const checkbox = item.querySelector('.esus-avaliacao-checkbox');
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });

        // Evento de alteração no checkbox
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const criterio = e.target.getAttribute('data-criterio');
                const index = parseInt(e.target.getAttribute('data-index'), 10);
                const item = RiskCriteria.getCriterio(criterio).items[index];

                if (e.target.checked) {
                    LensStore.addSelectedItem(criterio, {
                        title: item.title,
                        badge: item.badge
                    });
                } else {
                    LensStore.removeSelectedItem(criterio, item);
                }

                updateAccordionCounter(sidebar, criterio);
                console.log('[e-SUS Lens] Itens selecionados:', LensStore.getSelectedItems());
            });
        });

        // Eventos dos checkboxes de Sinais de Urgência
        const urgenciaCheckboxes = sidebar.querySelectorAll('.esus-urgencia-checkbox');
        const urgenciaItems = sidebar.querySelectorAll('.esus-urgencia-item');

        urgenciaItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.tagName.toLowerCase() === 'input') return;
                e.preventDefault();
                const checkbox = item.querySelector('.esus-urgencia-checkbox');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });

        urgenciaCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'), 10);
                const urgenciasData = (typeof RiskCriteria !== 'undefined' && RiskCriteria.getSinaisUrgencia)
                    ? RiskCriteria.getSinaisUrgencia()
                    : (typeof SINAIS_URGENCIA !== 'undefined' ? SINAIS_URGENCIA : null);

                const items = urgenciasData?.sinaisUrgencia?.itens || urgenciasData?.sinaisUrgencia?.items || [];
                const item = items[index];
                if (!item) return;

                if (e.target.checked) {
                    LensStore.addSelectedUrgencia(item);
                } else {
                    LensStore.removeSelectedUrgencia(item);
                }

                console.log('[e-SUS Lens] Sinais de Urgência selecionados:', LensStore.getSelectedUrgencias());
            });
        });
    }

    return {
        render,
        renderUrgencias,
        initCheckboxes,
        updateAccordionCounter
    };
})();

// Compatibilidade global legada
function renderAvaliacaoAccordions(data) {
    return RiskAccordionTemplate.render(data);
}
function initAvaliacaoCheckboxes(sidebar) {
    RiskAccordionTemplate.initCheckboxes(sidebar);
}
function updateAccordionCounter(sidebar, criterio) {
    RiskAccordionTemplate.updateAccordionCounter(sidebar, criterio);
}

