/**
 * content.js
 * Ponto de entrada (Entrypoint / Controller) do e-SUS PEC Lens.
 * Responsável apenas pela orquestração dos módulos, listeners de eventos e ciclo de vida.
 */

(function initEsusLens() {
    console.log("[e-SUS Lens] Inicializando content script...");

    // 1. Injeta script no contexto da página original para interceptar chamadas GraphQL e rotas SPA
    PageInjector.inject('scripts/inject.js');

    // 2. Monitoramento contínuo de troca de paciente no SPA do e-SUS PEC
    PecObserver.setupSpaNavigationObserver((newPatientName) => {
        console.log(`[e-SUS Lens] Detectada troca de paciente para "${newPatientName}". Reextraindo dados...`);
        WasmExtractor.executeExtractionPipeline(true);
    });

    // 3. Ouve o evento de GraphQL interceptado pelo inject.js
    window.addEventListener('esus_graphql_intercepted', (e) => {
        console.log("[e-SUS Lens] Dados de GraphQL interceptados:", e.detail);
        localStorage.setItem('__ESUS_GRAPHQL_DATA__', JSON.stringify(e.detail));

        // Atualiza a extração com os novos dados em segundo plano
        WasmExtractor.executeExtractionPipeline(true);
    });

    // 4. Listener para comando de atalho / clique no ícone da extensão
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "TOGGLE_SIDEBAR") {
            const sidebar = document.getElementById("esus-lens-sidebar");
            if (sidebar) {
                LensSidebar.toggleSidebar();
            } else {
                WasmExtractor.executeExtractionPipeline(false);
            }
        }
    });

    // 5. Execução inicial ao carregar a página
    WasmExtractor.executeExtractionPipeline(false);
})();
