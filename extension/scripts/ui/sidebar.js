/**
 * sidebar.js
 * Montagem, renderização e controle de visibilidade da Sidebar do e-SUS Lens.
 */

const LensSidebar = (() => {
    function render(data) {
        const existingSidebar = document.getElementById("esus-lens-sidebar");
        if (existingSidebar) {
            existingSidebar.remove();
        }

        if (!data) return;

        const isPregnant = data.is_pregnant === true;
        // renderPatientSummaryCard deve ser exibido apenas nas 3 primeiras abas: Gestante, Avaliação e Classificação
        const initialHeaderVisible = isPregnant; // se gestante, abre em tab-geral (visível); se não, abre em tab-acesso-saude (oculto)
        const sidebar = document.createElement("div");
        sidebar.id = "esus-lens-sidebar";

        sidebar.innerHTML = `
            ${PatientHeaderTemplate.renderTopHeader()}
            ${PatientHeaderTemplate.renderTabsNavigation(isPregnant)}
            ${PatientHeaderTemplate.renderPatientSummaryCard(data, initialHeaderVisible)}

            <!-- ABA 1: VISÃO GERAL -->
            <div id="tab-geral" class="esus-tab-content ${isPregnant ? 'active' : ''}" style="padding: 16px; background-color: #F8FAFC;">
                ${PatientDataTemplate.render(data)}
            </div>

            <!-- ABA 2: SÓCIO-DEMOGRÁFICO (AVALIAÇÃO) -->
            <div id="tab-socio" class="esus-tab-content" style="padding: 16px; background-color: #F8FAFC; padding-top: 0;">
                <div id="esus-input-risk-container" style="margin-top: 16px;">
                    ${typeof InputRiskDataTemplate !== 'undefined' ? InputRiskDataTemplate.inputCard() : ''}
                </div>
                <div style="margin-bottom: 14px;">
                    <h3 style="margin: 0; font-size: 0.95rem; font-weight: 600; color: #000000ff;">Avaliação clínica</h3>
                    <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: #666;">Marque os critérios presentes para apoiar a classificação de risco.</p>
                </div>
                <div id="esus-avaliacoes-container" style="margin-top: 16px;">
                    ${RiskAccordionTemplate.render(data)}
                </div>
            </div>

            <!-- ABA 3: CONDIÇÕES DE SAÚDE (CLÍNICO) -->
            <div id="tab-saude" class="esus-tab-content" style="padding: 16px; background-color: #F8FAFC; padding-top: 0;">
                <div style="background-color: #FFF3E0; border-left: 4px solid #FF9800; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px;">
                    <p style="margin: 0; font-size: 0.85rem; color: #E65100;">Estes dados são auto-referidos pela paciente durante o Cadastro Individual.</p>
                </div>
            </div>

            <!-- ABA 4: ACESSO SAÚDE CE (Teleconsultoria) -->
            <div id="tab-acesso-saude" class="esus-tab-content ${isPregnant ? '' : 'active'}" style="padding: 16px; background-color: #F8FAFC;">
                ${typeof AcessoSaude !== 'undefined' ? AcessoSaude.tabHtml() : ''}
            </div>
        `;

        document.body.appendChild(sidebar);

        // Inicializa aba Acesso Saúde CE
        if (typeof AcessoSaude !== 'undefined') {
            AcessoSaude.setPatient(data);
            AcessoSaude.init(sidebar);
        }

        // Eventos de troca de aba principal
        const tabButtons = sidebar.querySelectorAll('.esus-tab');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.currentTarget.getAttribute('data-tab');
                switchTab(tabId, sidebar);
            });
        });

        // Eventos de sub-seções (Geral / Social / Clínico)
        PatientDataTemplate.initButtonGroupEvents(sidebar);

        // Eventos de inputs complementares de risco
        if (typeof InputRiskDataTemplate !== 'undefined' && InputRiskDataTemplate.initEvents) {
            InputRiskDataTemplate.initEvents(sidebar);
        }

        // Eventos de checkboxes dos acordeões
        RiskAccordionTemplate.initCheckboxes(sidebar);

        // Empurra o e-SUS PEC para a esquerda
        document.body.style.transition = "padding-right 0.3s ease-in-out";
        document.body.style.paddingRight = "400px";
        LensStore.setSidebarOpen(true);
        isSidebarOpen = true;

        // Botão Fechar (minimizar)
        sidebar.querySelector("#esus-lens-close")?.addEventListener("click", () => {
            closeSidebar(sidebar);
        });
    }

    function closeSidebar(sidebar) {
        const el = sidebar || document.getElementById("esus-lens-sidebar");
        if (!el) return;

        el.style.transform = "translateX(400px)";
        document.body.style.paddingRight = "0";
        LensStore.setSidebarOpen(false);
        isSidebarOpen = false;

        LensReopenButton.show(() => {
            openSidebar(el);
        });
    }

    function openSidebar(sidebar) {
        const el = sidebar || document.getElementById("esus-lens-sidebar");
        if (!el) return;

        el.style.transform = "translateX(0)";
        document.body.style.paddingRight = "400px";
        LensStore.setSidebarOpen(true);
        isSidebarOpen = true;
        LensReopenButton.hide();
    }

    function switchTab(tabId, sidebar) {
        const el = sidebar || document.getElementById("esus-lens-sidebar");
        if (!el) return;

        const tabButtons = el.querySelectorAll('.esus-tab');
        const tabContents = el.querySelectorAll('.esus-tab-content');

        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });

        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });

        // renderPatientSummaryCard deve ser exibido apenas nas 3 primeiras abas: Gestante, Avaliação e Classificação
        const patientHeader = el.querySelector('#esus-patient-header');
        if (patientHeader) {
            const allowedTabs = ['tab-geral', 'tab-socio', 'tab-saude'];
            patientHeader.style.display = allowedTabs.includes(tabId) ? 'block' : 'none';
        }
    }

    function toggleSidebar() {
        const sidebar = document.getElementById("esus-lens-sidebar");
        if (!sidebar) return false;

        if (sidebar.style.transform === "translateX(400px)") {
            openSidebar(sidebar);
            return true;
        } else {
            closeSidebar(sidebar);
            return false;
        }
    }

    return {
        render,
        openSidebar,
        closeSidebar,
        toggleSidebar,
        switchTab
    };
})();

// Compatibilidade global legada
function showSidebar(data) {
    LensSidebar.render(data);
}

