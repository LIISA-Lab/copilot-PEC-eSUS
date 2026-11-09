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
    }

    return {
        render,
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

