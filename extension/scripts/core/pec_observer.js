/**
 * pec_observer.js
 * Observa mutações e ciclo de vida do DOM do SPA do e-SUS PEC,
 * detectando quando o prontuário de um paciente é aberto ou trocado.
 */

const PecObserver = (() => {
    let lastObservedPatientName = "";

    function waitForPatientNameElement(selector = "h2.css-k7p917", timeoutMs = 10000) {
        return new Promise((resolve) => {
            console.log("[e-SUS Lens] Procurando a UI do paciente no e-SUS PEC...");

            if (document.querySelector(selector)) {
                console.log("[e-SUS Lens] UI encontrada de imediato.");
                return resolve(document.querySelector(selector));
            }

            console.log("[e-SUS Lens] UI não está pronta ainda, aguardando MutationObserver...");
            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    console.log("[e-SUS Lens] UI detectada via MutationObserver.");
                    observer.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                console.warn(`[e-SUS Lens] Timeout de ${timeoutMs / 1000}s no MutationObserver. Prosseguindo.`);
                observer.disconnect();
                resolve(document.querySelector(selector));
            }, timeoutMs);
        });
    }

    function setupSpaNavigationObserver(onPatientChanged) {
        // 1. Observer no elemento h2 onde fica o nome do paciente no cabeçalho do PEC
        const domObserver = new MutationObserver(() => {
            const nameEl = document.querySelector("h2.css-k7p917");
            const currentName = nameEl ? nameEl.textContent.trim() : "";

            if (currentName && currentName !== lastObservedPatientName) {
                console.log(`[e-SUS Lens SPA] Nome do paciente mudou de "${lastObservedPatientName}" para "${currentName}".`);
                lastObservedPatientName = currentName;
                if (typeof onPatientChanged === "function") {
                    onPatientChanged(currentName);
                }
            }
        });

        domObserver.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        // 2. Ouve eventos de troca de rota no SPA disparados pelo inject.js (pushState/popstate)
        window.addEventListener('esus_route_changed', (e) => {
            console.log("[e-SUS Lens SPA] Rota do e-SUS mudou:", e.detail?.url);
            setTimeout(() => {
                const nameEl = document.querySelector("h2.css-k7p917");
                const currentName = nameEl ? nameEl.textContent.trim() : "";
                if (currentName && currentName !== lastObservedPatientName) {
                    lastObservedPatientName = currentName;
                    if (typeof onPatientChanged === "function") {
                        onPatientChanged(currentName);
                    }
                }
            }, 600);
        });
    }

    return {
        waitForPatientNameElement,
        setupSpaNavigationObserver,
        getCurrentPatientName: () => lastObservedPatientName
    };
})();

// Compatibilidade global legada
function waitForPatientNameElement() {
    return PecObserver.waitForPatientNameElement();
}
function setupSpaNavigationObserver() {
    PecObserver.setupSpaNavigationObserver(() => {
        if (typeof runWasmExtractor === "function") {
            runWasmExtractor(true);
        }
    });
}

