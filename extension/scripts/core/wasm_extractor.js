/**
 * wasm_extractor.js
 * Gerencia o carregamento sob demanda do módulo WebAssembly (Rust)
 * e a extração dos dados consolidados do paciente (DOM + GraphQL + IndexedDB).
 */

const WasmExtractor = (() => {
    let wasmModule = null;
    let isInitialized = false;

    async function getWasm() {
        if (isInitialized && wasmModule) {
            return wasmModule;
        }

        const wasmUrl = chrome.runtime.getURL("pkg/copilot_pec_esus.js");
        wasmModule = await import(wasmUrl);
        await wasmModule.default(chrome.runtime.getURL("pkg/copilot_pec_esus_bg.wasm"));
        isInitialized = true;
        return wasmModule;
    }

    async function extract() {
        const wasm = await getWasm();
        return await wasm.extract_patient_info_promise();
    }

    async function executeExtractionPipeline(isSilent = false) {
        try {
            await PecObserver.waitForPatientNameElement();

            if (!isSilent) console.log("[e-SUS Lens] UI detectada. Carregando módulo Wasm...");

            const patientData = await extract();
            if (!patientData) {
                return null;
            }

            console.log("[e-SUS Lens] Dados extraídos e consolidados pelo Rust:", patientData);

            // Atualiza Store Central
            LensStore.setPatient(patientData);

            // Atualiza Acesso Saúde CE
            if (typeof AcessoSaude !== "undefined") {
                AcessoSaude.setPatient(patientData);
            }

            // Injeta tutelamento no PEC nativo
            PecBanner.embed(patientData);

            // Renderiza Sidebar
            LensSidebar.render(patientData);

            // Notifica Background Service Worker
            chrome.runtime.sendMessage({
                type: "NOTIFY_PATIENT_DATA",
                payload: patientData
            });

            return patientData;
        } catch (error) {
            console.error("[e-SUS Lens] Erro na extração via Wasm:", error);
            return null;
        }
    }

    return {
        getWasm,
        extract,
        executeExtractionPipeline
    };
})();

// Compatibilidade global legada
async function runWasmExtractor(isSilent = false) {
    return WasmExtractor.executeExtractionPipeline(isSilent);
}

