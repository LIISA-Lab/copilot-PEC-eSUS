function showSidebar(data) {
  // Evita duplicar a sidebar caso já exista
  if (document.getElementById("esus-lens-sidebar")) {
      // Atualizar dados da sidebar aberta futuramente...
      return;
  }

  // Tratamento de Elegibilidade (Motor de Regras bloqueou o paciente)
  if (!data) {
      alert("e-SUS Lens: Este paciente não possui critérios obstétricos registrados (CIAP/CID ou Cadastro) para iniciar a estratificação de risco.");
      return;
  }

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
  const formatBool = (val, isRisk = false) => {
      if (val === true) return `<span style="font-weight: 500; color: ${isRisk ? '#c62828' : '#333'};">Sim</span>`;
      if (val === false) return `<span style="color: #555;">Não</span>`;
      return `<span style="color: #aaa;">Não inf.</span>`;
  };

  const formatVal = (val) => val ? `<span style="font-weight: 500; color: #333;">${val}</span>` : `<span style="color: #aaa;">Não inf.</span>`;

  const sd = data.sociodemografico || {};
  const cs = data.condicoes_saude || {};

  sidebar.innerHTML = `
    <style>
        .esus-tab { flex: 1; padding: 12px 0; border: none; background: none; cursor: pointer; font-weight: 500; color: #666; border-bottom: 3px solid transparent; transition: all 0.2s; }
        .esus-tab:hover { background-color: #f1f1f1; }
        .esus-tab.active { color: #1351b4; border-bottom: 3px solid #1351b4; background-color: #F8F9FA;}
        .esus-tab-content { display: none; padding: 16px; background-color: #F8F9FA; height: calc(100vh - 110px); overflow-y: auto;}
        .esus-tab-content.active { display: block; }

        .esus-accordion { background: #fff; border: 1px solid #E0E0E0; border-radius: 6px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden; }
        .esus-accordion summary { padding: 12px 16px; font-weight: 500; color: #1351b4; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; background: #fafafa; border-bottom: 1px solid transparent; }
        .esus-accordion summary::-webkit-details-marker { display: none; }
        .esus-accordion summary::after { content: "▼"; font-size: 0.8em; color: #888; transition: transform 0.2s;}
        .esus-accordion[open] summary { border-bottom: 1px solid #eee; }
        .esus-accordion[open] summary::after { transform: rotate(180deg); }
        .acc-content { padding: 16px; font-size: 0.9rem; color: #555; }
        
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .data-label { display: block; font-size: 0.75rem; text-transform: uppercase; color: #888; margin-bottom: 2px; }
    </style>

    <!-- Header simulando identidade do e-SUS PEC (Azul gov.br) -->
    <div style="background-color: #1351b4; color: white; padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #f8d117;">
        <div style="display: flex; flex-direction: column;">
            <h2 style="margin: 0; font-size: 1.1rem; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                <span>🩺</span> e-SUS Lens: Estratificação
            </h2>
            <span style="font-size: 0.7rem; color: #b3cde0; margin-top: 4px; font-family: monospace;">v${chrome.runtime.getManifest().version}</span>
        </div>
        <button id="esus-lens-close" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; padding: 4px;" title="Minimizar">✖</button>
    </div>

    <!-- Navegação em Abas -->
    <div style="display: flex; background: #fff; border-bottom: 1px solid #ccc;">
        <button class="esus-tab active" data-tab="tab-geral">Visão Geral</button>
        <button class="esus-tab" data-tab="tab-socio">Sócio-Dem.</button>
        <button class="esus-tab" data-tab="tab-saude">Clínico</button>
    </div>

    <!-- ABA 1: VISÃO GERAL -->
    <div id="tab-geral" class="esus-tab-content active">
        <!-- Alerta de Identificação -->
        <div style="background-color: #E8F5E9; border-left: 4px solid #4CAF50; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 4px 0; color: #2E7D32; font-size: 1rem;">🤰 Paciente em Monitoramento</h3>
            <p style="margin: 0; font-size: 0.85rem; color: #1B5E20;">Dados interceptados do e-SUS</p>
        </div>

        <details class="esus-accordion" open>
            <summary>Identificação Rápida</summary>
            <div class="acc-content">
                <div style="margin-bottom: 12px;">
                    <strong class="data-label">Nome Completo</strong>
                    ${formatVal(data.name)}
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Idade / Nasc.</strong>
                        ${formatVal(data.age)}
                    </div>
                    <div>
                        <strong class="data-label">Sexo / Gênero</strong>
                        <span>
                            ${data.sex ? data.sex.charAt(0).toUpperCase() + data.sex.slice(1).toLowerCase() : 'Não inf.'}
                            ${data.gender_identity ? `<br><small style="color:#777;">(${data.gender_identity.replace('_', ' ')})</small>` : ''}
                        </span>
                    </div>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">CPF</strong>
                        ${formatVal(data.cpf)}
                    </div>
                    <div>
                        <strong class="data-label">CNS</strong>
                        ${formatVal(data.cns)}
                    </div>
                </div>
            </div>
        </details>

        <details class="esus-accordion" open>
            <summary>Módulo Obstétrico</summary>
            <div class="acc-content">
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Última DUM</strong>
                        <span style="font-weight: 500; color: #D84315;">${data.ultima_dum || 'Sem Registro'}</span>
                    </div>
                    <div>
                        <strong class="data-label">Idade Gestacional</strong>
                        <span style="font-weight: 500; color: #1565C0;">
                            ${data.idade_gestacional_dias ? Math.floor(data.idade_gestacional_dias / 7) + ' sem ' + (data.idade_gestacional_dias % 7) + ' d' : 'Sem Registro'}
                        </span>
                    </div>
                </div>
                <div style="margin-bottom: 12px;">
                    <strong class="data-label">CIPA Atual</strong>
                    <span style="background-color: #E3F2FD; color: #1565C0; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; display: inline-block; margin-top: 4px;">
                        ${data.cod_cipa || '-'}
                    </span>
                </div>
                <div>
                    <strong class="data-label">Status de Risco Clínico</strong>
                    <span style="color: #9E9E9E; font-style: italic; font-size: 0.85rem;">Aguardando motor de regras...</span>
                </div>
            </div>
        </details>

        <details class="esus-accordion">
            <summary>Profissional Logado</summary>
            <div class="acc-content">
                <div style="margin-bottom: 12px;">
                    <strong class="data-label">Médico / Profissional</strong>
                    <span style="font-weight: 500; color: #1351b4;">
                        ${data.session_info ? data.session_info.professional_name : 'Intercepção Pendente...'}
                    </span>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">CBO</strong>
                        ${formatVal(data.session_info?.cbo_name)}
                    </div>
                    <div>
                        <strong class="data-label">Unidade (UBS)</strong>
                        <span style="font-size: 0.8rem;">${data.session_info?.health_unit_name || 'Não inf.'}</span>
                    </div>
                </div>
            </div>
        </details>
    </div>

    <!-- ABA 2: SÓCIO-DEMOGRÁFICO -->
    <div id="tab-socio" class="esus-tab-content">
        <details class="esus-accordion" open>
            <summary>Contato e Raça/Cor</summary>
            <div class="acc-content">
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Telefone Celular</strong>
                        ${formatVal(data.telefone_celular)}
                    </div>
                    <div>
                        <strong class="data-label">Raça / Cor</strong>
                        ${formatVal(data.raca_cor)}
                    </div>
                </div>
                <div>
                    <strong class="data-label">Nome da Mãe</strong>
                    ${formatVal(data.mother_name)}
                </div>
            </div>
        </details>

        <details class="esus-accordion" open>
            <summary>Educação e Trabalho</summary>
            <div class="acc-content">
                <div style="margin-bottom: 12px;">
                    <strong class="data-label">Escolaridade</strong>
                    ${formatVal(sd.escolaridade)}
                </div>
                <div style="margin-bottom: 12px;">
                    <strong class="data-label">Ocupação (CBO)</strong>
                    ${formatVal(sd.ocupacao)}
                </div>
                <div>
                    <strong class="data-label">Situação no Mercado</strong>
                    ${formatVal(sd.situacao_mercado_trabalho ? sd.situacao_mercado_trabalho.replace(/_/g, ' ') : null)}
                </div>
            </div>
        </details>

        <details class="esus-accordion" open>
            <summary>Informações Sociais</summary>
            <div class="acc-content">
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Plano de Saúde Privado?</strong>
                        ${formatBool(sd.possui_plano_saude_privado)}
                    </div>
                    <div>
                        <strong class="data-label">Possui Deficiência?</strong>
                        ${formatBool(sd.possui_deficiencia)}
                    </div>
                </div>
            </div>
        </details>
    </div>

    <!-- ABA 3: CONDIÇÕES DE SAÚDE (CLÍNICO) -->
    <div id="tab-saude" class="esus-tab-content">
        <div style="background-color: #FFF3E0; border-left: 4px solid #FF9800; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 0.85rem; color: #E65100;">Estes dados são auto-referidos pela paciente durante o Cadastro Individual.</p>
        </div>

        <details class="esus-accordion" open>
            <summary>Doenças Crônicas</summary>
            <div class="acc-content">
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Hipertensão Arterial</strong>
                        ${formatBool(cs.hipertensao_arterial, true)}
                    </div>
                    <div>
                        <strong class="data-label">Diabetes</strong>
                        ${formatBool(cs.diabetes, true)}
                    </div>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Doença Cardíaca</strong>
                        ${formatBool(cs.doenca_cardiaca, true)}
                        ${cs.detalhes_doenca_cardiaca ? `<div style="font-size:0.75rem; color:#d32f2f; margin-top:2px;">${cs.detalhes_doenca_cardiaca.join(', ').replace(/_/g, ' ')}</div>` : ''}
                    </div>
                    <div>
                        <strong class="data-label">Problemas nos Rins</strong>
                        ${formatBool(cs.problema_rins, true)}
                        ${cs.detalhes_doenca_rins ? `<div style="font-size:0.75rem; color:#d32f2f; margin-top:2px;">${cs.detalhes_doenca_rins.join(', ').replace(/_/g, ' ')}</div>` : ''}
                    </div>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Asma / DPOC</strong>
                        ${formatBool(cs.doenca_respiratoria, true)}
                        ${cs.detalhes_doenca_respiratoria ? `<div style="font-size:0.75rem; color:#d32f2f; margin-top:2px;">${cs.detalhes_doenca_respiratoria.join(', ').replace(/_/g, ' ')}</div>` : ''}
                    </div>
                    <div>
                        <strong class="data-label">Câncer</strong>
                        ${formatBool(cs.cancer, true)}
                    </div>
                </div>
            </div>
        </details>
        
        <details class="esus-accordion" open>
            <summary>Eventos Cardiovasculares e Infecciosos</summary>
            <div class="acc-content">
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Derrame / AVC</strong>
                        ${formatBool(cs.derrame, true)}
                    </div>
                    <div>
                        <strong class="data-label">Infarto</strong>
                        ${formatBool(cs.infarto, true)}
                    </div>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Hanseníase</strong>
                        ${formatBool(cs.hanseniase, true)}
                    </div>
                    <div>
                        <strong class="data-label">Tuberculose</strong>
                        ${formatBool(cs.tuberculose, true)}
                    </div>
                </div>
            </div>
        </details>

        <details class="esus-accordion" open>
            <summary>Condições Especiais</summary>
            <div class="acc-content">
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Acamado</strong>
                        ${formatBool(cs.acamado, true)}
                    </div>
                    <div>
                        <strong class="data-label">Atendimento Domiciliar</strong>
                        ${formatBool(cs.domiciliar, false)}
                    </div>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Problema de Saúde Mental</strong>
                        ${formatBool(cs.saude_mental, true)}
                    </div>
                    <div>
                        <strong class="data-label">Internação 12 Meses</strong>
                        ${formatBool(cs.internacao_12_meses, true)}
                        ${cs.causa_internacao ? `<div style="font-size:0.75rem; color:#d32f2f; margin-top:2px;">Motivo: ${cs.causa_internacao}</div>` : ''}
                    </div>
                </div>
            </div>
        </details>

        <details class="esus-accordion" open>
            <summary>Hábitos</summary>
            <div class="acc-content">
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Fumante</strong>
                        ${formatBool(cs.fumante, true)}
                    </div>
                    <div>
                        <strong class="data-label">Uso de Álcool</strong>
                        ${formatBool(cs.uso_alcool, true)}
                    </div>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Uso de Outras Drogas</strong>
                        ${formatBool(cs.uso_drogas, true)}
                    </div>
                    <div>
                        <strong class="data-label">Uso de Plantas Med.</strong>
                        ${formatBool(cs.plantas_medicinais, false)}
                    </div>
                </div>
            </div>
        </details>
    </div>
  `;

  document.body.appendChild(sidebar);

  // Lógica das Abas (Tabs)
  const tabButtons = sidebar.querySelectorAll('.esus-tab');
  const tabContents = sidebar.querySelectorAll('.esus-tab-content');

  tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
          // Remove active de todos
          tabButtons.forEach(b => b.classList.remove('active'));
          tabContents.forEach(c => c.classList.remove('active'));
          
          // Adiciona active no clicado
          e.target.classList.add('active');
          const tabId = e.target.getAttribute('data-tab');
          sidebar.querySelector('#' + tabId).classList.add('active');
      });
  });

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

    // 3. Chama a função em Rust que lê o DOM, Mescla com Banco Local e devolve o Objeto
    try {
        const patientData = await wasm.extract_patient_info_promise();
        console.log("[e-SUS Lens] Dados extraídos e consolidados pelo Rust:", patientData);

        // 4. Injeta a Sidebar Lateral do Painel
        showSidebar(patientData);

        // 5. Envia os dados para o Background Script tentar gerar a notificação do SO
        chrome.runtime.sendMessage({
            type: "NOTIFY_PATIENT_DATA",
            payload: patientData
        });
    } catch (err) {
        console.error("[e-SUS Lens] O Rust retornou um Erro:", err);
    }

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
