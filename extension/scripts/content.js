function showSidebar(data) {
  // Evita duplicar a sidebar caso já exista
  if (document.getElementById("esus-lens-sidebar")) return;

  const sidebar = document.createElement("div");
  sidebar.id = "esus-lens-sidebar";

  // Estilo principal: Sidebar fixada à direita ocupando a altura toda (tipo DevTools)
  sidebar.style.position = "fixed";
  sidebar.style.top = "0";
  sidebar.style.right = "0";
  sidebar.style.width = "400px";
  sidebar.style.height = "100vh";
  sidebar.style.backgroundColor = "#FFFFFF"; // Fundo branco padrão
  sidebar.style.borderLeft = "1px solid #E0E0E0"; // Borda sutil de separação
  sidebar.style.zIndex = "999999";
  sidebar.style.boxShadow = "-4px 0 15px rgba(0,0,0,0.05)";
  sidebar.style.fontFamily = "'Roboto', 'Segoe UI', Arial, sans-serif";
  sidebar.style.display = "flex";
  sidebar.style.flexDirection = "column";
  sidebar.style.transition = "transform 0.3s ease-in-out";
  sidebar.style.transform = "translateX(0)";

  // Layout interno da Sidebar (Header + Content)
  sidebar.innerHTML = `
    <!-- Header simulando identidade do e-SUS PEC (Azul gov.br) -->
    <div style="
        background-color: #1351b4;
        color: white;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 3px solid #f8d117;
    ">
        <h2 style="margin: 0; font-size: 1.1rem; font-weight: 500; display: flex; align-items: center; gap: 8px;">
            <span>🩺</span> e-SUS Lens: Estratificação
        </h2>
        <button id="esus-lens-close" style="
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 4px;
        " title="Minimizar">✖</button>
    </div>

    <!-- Content (Área de scroll) -->
    <div style="padding: 20px; flex-grow: 1; overflow-y: auto; background-color: #F8F9FA;">

        <!-- Alerta de Identificação -->
        <div style="
            background-color: #E8F5E9;
            border-left: 4px solid #4CAF50;
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 24px;
        ">
            <h3 style="margin: 0 0 4px 0; color: #2E7D32; font-size: 1rem;">🤰 Paciente em Monitoramento</h3>
            <p style="margin: 0; font-size: 0.85rem; color: #1B5E20;">Dados extraídos da Folha de Rosto</p>
        </div>

        <!-- Card de Dados Demográficos -->
        <div style="
            background-color: white;
            border: 1px solid #E0E0E0;
            border-radius: 6px;
            padding: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        ">
            <h4 style="margin: 0 0 16px 0; color: #333; font-size: 0.95rem; border-bottom: 1px solid #EEE; padding-bottom: 8px;">
                Identificação
            </h4>

            <div style="display: grid; gap: 12px; font-size: 0.9rem; color: #555;">
                <div>
                    <strong style="color: #333; display: block; font-size: 0.8rem; text-transform: uppercase; color: #888;">Nome Completo</strong>
                    <span style="font-weight: 500; color: #222;">${data.name || 'Não informado'}</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                        <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #888;">Idade</strong>
                        <span>${data.age || 'Não inf.'}</span>
                    </div>
                    <div>
                        <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #888;">CPF</strong>
                        <span>${data.cpf || 'Não inf.'}</span>
                    </div>
                </div>

                <div>
                    <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #888;">Nome da Mãe</strong>
                    <span>${data.mother_name || 'Não informado'}</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                        <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #888;">CIPA</strong>
                        <span style="background-color: #E3F2FD; color: #1565C0; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem;">
                            ${data.cod_cipa || '-'}
                        </span>
                    </div>
                    <div>
                        <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #888;">Status de Risco</strong>
                        <span style="color: #9E9E9E; font-style: italic; font-size: 0.85rem;">Aguardando cálculo...</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card do Profissional (Dados via GraphQL) -->
        <div style="
            background-color: white;
            border: 1px solid #E0E0E0;
            border-radius: 6px;
            padding: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
            margin-top: 16px;
        ">
            <h4 style="margin: 0 0 16px 0; color: #333; font-size: 0.95rem; border-bottom: 1px solid #EEE; padding-bottom: 8px;">
                Profissional Logado
            </h4>
            
            <div style="display: grid; gap: 12px; font-size: 0.9rem; color: #555;">
                <div>
                    <strong style="color: #333; display: block; font-size: 0.8rem; text-transform: uppercase; color: #888;">Médico / Profissional</strong>
                    <span style="font-weight: 500; color: #1351b4;">
                        ${data.session_info ? data.session_info.professional_name : 'Intercepção Pendente...'}
                    </span>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                        <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #888;">CBO</strong>
                        <span>${data.session_info ? data.session_info.cbo_name : '-'}</span>
                    </div>
                    <div>
                        <strong style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #888;">Unidade</strong>
                        <span style="font-size: 0.8rem;">${data.session_info ? data.session_info.health_unit_name : '-'}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `;

  document.body.appendChild(sidebar);

  // Lógica para empurrar o conteúdo do e-SUS para o lado (igual o DevTools Docked)
  // Como o e-SUS usa body e frameworks variados, aplicar um padding-right na tag principal é seguro
  document.body.style.transition = "padding-right 0.3s ease-in-out";
  document.body.style.paddingRight = "400px";

  // Botão fechar (Minimizar)
  document.getElementById("esus-lens-close").addEventListener("click", () => {
    sidebar.style.transform = "translateX(400px)";
    document.body.style.paddingRight = "0";

    // Adiciona um botão flutuante para reabrir (Miniatura)
    showReopenButton(sidebar);
  });
}

function showReopenButton(sidebarRef) {
    if (document.getElementById("esus-lens-reopen")) {
        document.getElementById("esus-lens-reopen").style.display = "flex";
        return;
    }

    const btn = document.createElement("button");
    btn.id = "esus-lens-reopen";
    btn.innerHTML = "🩺 e-SUS Lens";
    btn.title = "Abrir Painel de Estratificação";

    // Estilo flutuante no canto da tela
    btn.style.position = "fixed";
    btn.style.bottom = "24px";
    btn.style.right = "24px";
    btn.style.backgroundColor = "#1351b4";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "24px";
    btn.style.padding = "10px 20px";
    btn.style.fontSize = "0.9rem";
    btn.style.fontWeight = "bold";
    btn.style.boxShadow = "0 4px 6px rgba(0,0,0,0.2)";
    btn.style.cursor = "pointer";
    btn.style.zIndex = "999999";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.gap = "8px";

    btn.addEventListener("click", () => {
        sidebarRef.style.transform = "translateX(0)";
        document.body.style.paddingRight = "400px";
        btn.style.display = "none";
    });

    document.body.appendChild(btn);
}

function waitForPatientNameElement() {
  return new Promise((resolve) => {
    // 1. Log inicial para garantir que o script foi injetado pelo Chrome
    console.log("[e-SUS Lens] Script injetado! Procurando a UI...");

    // Verifica se já existe ao inicializar
    if (document.querySelector("h2.css-k7p917")) {
      console.log("[e-SUS Lens] UI encontrada de imediato.");
      return resolve();
    }

    console.log("[e-SUS Lens] UI não está pronta ainda, aguardando MutationObserver...");
    
    const observer = new MutationObserver((mutations) => {
      if (document.querySelector("h2.css-k7p917")) {
        console.log("[e-SUS Lens] UI detectada via MutationObserver.");
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Fallback/Timeout: Se a UI não carregar em 10 segundos, tentamos mesmo assim e avisamos o log.
    setTimeout(() => {
       console.warn("[e-SUS Lens] Timeout de 10 segundos no MutationObserver. Tentando prosseguir mesmo assim.");
       observer.disconnect();
       resolve();
    }, 10000);
  });
}

async function runWasmExtractor() {
  try {
    // 1. Espera a UI do paciente carregar
    await waitForPatientNameElement();
    console.log("[e-SUS Lens] UI detectada. Carregando módulo Wasm...");

    // 2. Importa e inicializa o WebAssembly compilado
    const wasmUrl = chrome.runtime.getURL("pkg/copilot_pec_esus.js");
    const wasm = await import(wasmUrl);
    await wasm.default(chrome.runtime.getURL("pkg/copilot_pec_esus_bg.wasm"));

    // 3. Chama a função em Rust que lê o DOM e devolve o Objeto
    const patientData = wasm.extract_patient_info();
    console.log("[e-SUS Lens] Dados extraídos com sucesso pelo Rust:", patientData);

    // 4. Injeta a Sidebar Lateral do Painel
    showSidebar(patientData);

    // 5. Envia os dados para o Background Script tentar gerar a notificação do SO
    chrome.runtime.sendMessage({
      type: "NOTIFY_PATIENT_DATA",
      payload: patientData
    });

  } catch (error) {
    console.error("[e-SUS Lens] Erro ao executar extração via Wasm:", error);
  }
}

// Injecta o rastreador de GraphQL na página original (para burlar isolamento de extensão)
const script = document.createElement('script');
script.src = chrome.runtime.getURL('scripts/inject.js');
script.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Ouve o evento emitido pelo inject.js caso ele consiga pegar os dados
window.addEventListener('esus_graphql_intercepted', (e) => {
    console.log("[e-SUS Lens Content] Recebido sinal do interceptor:", e.detail);
    // Vamos salvar no LocalStorage pra garantir que o Wasm sempre ache, mesmo se a variável global sumir
    localStorage.setItem('__ESUS_GRAPHQL_DATA__', JSON.stringify(e.detail));
});

// Listener para abrir a sidebar quando o ícone da extensão é clicado
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_SIDEBAR") {
    const sidebar = document.getElementById("esus-lens-sidebar");
    
    // Se a sidebar já existe, só controlamos a visibilidade (abre/fecha)
    if (sidebar) {
      if (sidebar.style.transform === "translateX(400px)") {
        sidebar.style.transform = "translateX(0)";
        document.body.style.paddingRight = "400px";
      } else {
        sidebar.style.transform = "translateX(400px)";
        document.body.style.paddingRight = "0";
      }
    } else {
      // Se a sidebar não existe, chama o fluxo do Wasm para extrair e criá-la
      runWasmExtractor();
    }
  }
});
