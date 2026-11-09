/**
 * pec_banner.js
 * Injeta o banner de tutelamento clínico diretamente na interface nativa do e-SUS PEC
 * (logo abaixo do nome da gestante), sinalizando completude para teleconsultoria.
 */

const PecBanner = (() => {
    function openSidebarToAcessoSaude() {
        const sidebar = document.getElementById("esus-lens-sidebar");
        if (!sidebar) {
            if (typeof runWasmExtractor === "function") {
                runWasmExtractor(false);
            }
            return;
        }

        sidebar.style.transform = "translateX(0)";
        document.body.style.paddingRight = "400px";
        LensStore.setSidebarOpen(true);
        isSidebarOpen = true;

        if (typeof LensSidebar !== "undefined" && LensSidebar.switchTab) {
            LensSidebar.switchTab('tab-acesso-saude', sidebar);
        } else {
            const btnAcesso = sidebar.querySelector('button[data-tab="tab-acesso-saude"]');
            if (btnAcesso) btnAcesso.click();
        }

        LensReopenButton.hide();
    }

    function embed(patient) {
        if (!patient || !window.AcessoSaude?.avaliarCompletude) return;

        // Remove embeds anteriores para reavaliar sem duplicar
        const oldBanner = document.getElementById("esus-lens-pec-banner");
        if (oldBanner) oldBanner.remove();

        const avaliacao = AcessoSaude.avaliarCompletude(patient, "", "");
        const headerAlvo = document.querySelector("h2.css-k7p917");
        if (!headerAlvo || !headerAlvo.parentElement) return;

        const banner = document.createElement("div");
        banner.id = "esus-lens-pec-banner";
        banner.style.margin = "10px 0 14px 0";
        banner.style.padding = "10px 14px";
        banner.style.borderRadius = "6px";
        banner.style.fontFamily = "'Roboto', 'Segoe UI', Arial, sans-serif";
        banner.style.fontSize = "0.85rem";
        banner.style.display = "flex";
        banner.style.alignItems = "center";
        banner.style.justifyContent = "space-between";
        banner.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
        banner.style.transition = "all 0.2s ease-in-out";

        if (avaliacao.prontoParaEnvio) {
            banner.style.backgroundColor = "#E8F5E9";
            banner.style.borderLeft = "4px solid #4CAF50";
            banner.style.color = "#1B5E20";

            banner.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.1rem;">🩺</span>
                    <span>
                        <strong>e-SUS Lens:</strong> Dados clínicos aptos para solicitar teleconsultoria no <strong>Acesso Saúde CE</strong>.
                    </span>
                </div>
                <button id="esus-lens-btn-abrir-acesso" style="background-color: #2E7D32; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; font-weight: 600; cursor: pointer; font-size: 0.8rem; white-space: nowrap;">
                    Solicitar Parecer ➔
                </button>
            `;
        } else {
            banner.style.backgroundColor = "#FFF3CD";
            banner.style.borderLeft = "4px solid #FFA000";
            banner.style.color = "#856404";

            const pendenciasTexto = avaliacao.criticosPendentes.map((c) => c.titulo).join(", ");

            banner.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.1rem;">💡</span>
                    <div>
                        <strong>e-SUS Lens (Acesso Saúde CE):</strong> Faltam dados essenciais para teleconsultoria:
                        <span style="color: #d32f2f; font-weight: 500;"> ${pendenciasTexto}</span>.
                    </div>
                </div>
                <button id="esus-lens-btn-abrir-acesso" style="background-color: #1351b4; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; font-weight: 600; cursor: pointer; font-size: 0.8rem; white-space: nowrap; margin-left: 12px;">
                    Verificar Pendências ➔
                </button>
            `;
        }

        headerAlvo.parentElement.insertAdjacentElement("afterend", banner);

        banner.querySelector("#esus-lens-btn-abrir-acesso")?.addEventListener("click", (e) => {
            e.preventDefault();
            openSidebarToAcessoSaude();
        });
    }

    return {
        embed,
        openSidebarToAcessoSaude
    };
})();

// Compatibilidade global legada
function openSidebarToAcessoSaude() {
    PecBanner.openSidebarToAcessoSaude();
}
function embedPecGuidance(patient) {
    PecBanner.embed(patient);
}

