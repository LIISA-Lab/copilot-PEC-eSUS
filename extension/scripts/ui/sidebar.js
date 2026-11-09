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
        const sidebar = document.createElement("div");
        sidebar.id = "esus-lens-sidebar";

        sidebar.innerHTML = `
            ${PatientHeaderTemplate.renderTopHeader()}
            ${PatientHeaderTemplate.renderTabsNavigation(isPregnant)}
            ${PatientHeaderTemplate.renderPatientSummaryCard(data)}

            <!-- ABA 1: VISÃO GERAL -->
            <div id="tab-geral" class="esus-tab-content ${isPregnant ? 'active' : ''}" style="padding: 16px; background-color: #F8FAFC;">
                ${PatientDataTemplate.render(data)}
            </div>

            <!-- ABA 2: SÓCIO-DEMOGRÁFICO (AVALIAÇÃO) -->
            <div id="tab-socio" class="esus-tab-content" style="padding: 16px; background-color: #F8FAFC; padding-top: 0;">
                <div style="background-color: #FFF3E0; border-left: 4px solid #FF9800; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px;">
                    <p style="margin: 0; font-size: 0.85rem; color: #E65100;">Estes dados são auto-referidos pela paciente durante o Cadastro Individual.</p>
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
        const tabContents = sidebar.querySelectorAll('.esus-tab-content');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                e.target.classList.add('active');
                const tabId = e.target.getAttribute('data-tab');
                const targetContent = sidebar.querySelector('#' + tabId);
                if (targetContent) targetContent.classList.add('active');
            });
        });

        // Eventos de sub-seções (Geral / Social / Clínico)
        PatientDataTemplate.initButtonGroupEvents(sidebar);

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
        toggleSidebar
    };
})();

// Compatibilidade global legada
function showSidebar(data) {
    LensSidebar.render(data);
}

