// acesso_saude.js
// Aba "Acesso Saúde CE" da sidebar: monta o payload de teleconsultoria a partir dos dados
// do paciente (struct `Patient` de src/domain/patient.rs, serializada pelo Wasm) e envia
// para POST /solicitacoes/teleconsultoria_pec via background.js.

const AcessoSaude = (() => {
  const NOT_FOUND = "not found";
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Fallback usado quando GET /especialidades/ falha (o endpoint exige OAuth2 e pode
  // recusar a X-API-Key). Os nomes devem coincidir com os cadastrados na API.
  const ESPECIALIDADES_PADRAO = [
    "Cardiologia",
    "Clínica Geral",
    "Dermatologia",
    "Endocrinologia",
    "Gastroenterologia",
    "Geriatria",
    "Ginecologia e Obstetrícia",
    "Hematologia",
    "Infectologia",
    "Nefrologia",
    "Neurologia",
    "Oftalmologia",
    "Ortopedia",
    "Otorrinolaringologia",
    "Pediatria",
    "Pneumologia",
    "Psiquiatria",
    "Reumatologia",
    "Urologia",
  ];

  // Tradução das mensagens mais comuns de validação do FastAPI/Pydantic
  const PYDANTIC_MSGS = {
    "Field required": "campo obrigatório ausente",
  };

  // ⚠ VALORES DE TESTE — campos que o e-SUS PEC (struct Patient) não fornece.
  // emailUsuario agora é informado pelo profissional na aba da UBS.
  const VALORES_TESTE = {
    modalidade: "TELECONSULTA",
    orgaoExpedidorRegistro: "CRM",
    numeroRegistro: "12345",
    uFRegistro: "CE",
    estabelecimento: "1234567", // CNES
    municipioUbs: "Fortaleza", // usado se o município do paciente não for identificado
    pergunta: "Teste de integração e-SUS PEC Lens: solicitação de teleconsultoria com especialista.",
  };

  let currentPatient = null;

  // ─── Mapeamento Patient → payload ──────────────────────────────────────────

  const clean = (v) => (typeof v === "string" ? v.trim() : v);
  const required = (v) => clean(v) || NOT_FOUND; // obrigatório: "not found" se não identificado
  const optional = (v) => clean(v) || null; // opcional: omitido do multipart se não identificado

  function extractBirthDate(age) {
    // GraphQL entrega "dd/mm/aaaa"; o fallback do DOM pode trazer texto extra.
    const match = typeof age === "string" && age.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
    return match ? match[0] : NOT_FOUND;
  }

  function buildEndereco(end) {
    const logradouro = [end.tipo_logradouro?.nome, end.logradouro].filter(Boolean).join(" ");
    return logradouro || NOT_FOUND;
  }

  function buildNumero(end) {
    if (end.numero) return end.numero;
    if (end.sem_numero) return "S/N";
    return NOT_FOUND;
  }

  /**
   * Monta o payload de POST /solicitacoes/teleconsultoria_pec.
   * Campos obrigatórios não identificados no Patient recebem "not found";
   * campos opcionais não identificados ficam null (não são enviados).
   */
  function buildTeleconsultoriaPayload(patient, especialidade, interpreteLibras, emailUbs) {
    const p = patient || {};
    const end = p.endereco || {};
    const session = p.session_info || {};

    return {
      // Paciente
      dataNascimentoPaciente: extractBirthDate(p.age),
      cpfPaciente: required(p.cpf),
      nomePaciente: required(p.name),
      telePaciente: optional(p.telefone_celular),
      nomeMaePaciente: required(p.mother_name),
      cartaoNacionaldeSaude: optional(p.cns), // a API usa um default se omitido
      racaCor: required(p.raca_cor),
      etnia: null,

      // Endereço do paciente
      endereco: buildEndereco(end),
      numero: buildNumero(end),
      bairro: required(end.bairro),
      cep: required(end.cep),
      municipio: required(end.municipio?.nome),
      pontoReferencia: optional(end.ponto_referencia),
      // Endereço com UF/município do e-SUS (base nacional) ⇒ Brasil
      pais: end.uf?.nome || end.municipio?.nome ? "Brasil" : NOT_FOUND,

      // Solicitação
      especialidade: required(especialidade),
      interpreteLibras: interpreteLibras ? "sim" : "nao",
      modalidade: VALORES_TESTE.modalidade,
      pergunta: VALORES_TESTE.pergunta,

      // Profissional solicitante / estabelecimento
      nomeUsuario: required(session.professional_name),
      emailUsuario: required(emailUbs), // E-mail da Unidade Básica de Saúde
      telefoneUsuario: null,
      orgaoExpedidorRegistro: clean(session.conselho_classe_sigla) || VALORES_TESTE.orgaoExpedidorRegistro,
      nomeOutrosOrgaoExpedidorRegistro: null,
      numeroRegistro: clean(session.numero_conselho_classe) || VALORES_TESTE.numeroRegistro,
      uFRegistro: clean(session.uf_conselho_classe_sigla) || VALORES_TESTE.uFRegistro,
      estabelecimento: clean(session.health_unit_cnes) || VALORES_TESTE.estabelecimento, // CNES da UBS logada
      municipioUbs: clean(session.municipio_nome) || clean(end.municipio?.nome) || VALORES_TESTE.municipioUbs,
    };
  }

  // ─── Formatação de erros da API ───────────────────────────────────────────

  function describeError(result) {
    if (!result) return { title: "Sem resposta da extensão (service worker).", items: [] };
    if (result.error) return { title: result.error, items: [] };

    const detail = result.body && typeof result.body === "object" ? result.body.detail : result.body;

    // 422 do FastAPI: lista de erros por campo
    if (Array.isArray(detail)) {
      return {
        title: `Erro ${result.status}: campos inválidos ou ausentes no payload`,
        items: detail.map((d) => {
          const campo = Array.isArray(d.loc) ? d.loc.filter((l) => l !== "body").join(".") : "?";
          const msg = PYDANTIC_MSGS[d.msg] || d.msg || "inválido";
          const enviado = d.input !== undefined && typeof d.input !== "object" ? ` (enviado: "${d.input}")` : "";
          return `${campo}: ${msg}${enviado}`;
        }),
      };
    }

    const text = typeof detail === "string" ? detail : detail ? JSON.stringify(detail) : "Erro desconhecido";
    return { title: `Erro ${result.status}: ${text}`, items: [] };
  }

  // ─── UI ────────────────────────────────────────────────────────────────────

  function tabHtml() {
    return `
      <style>
        #tab-acesso-saude, #tab-acesso-saude *, #tab-acesso-saude *::before, #tab-acesso-saude *::after { box-sizing: border-box; }
        #tab-acesso-saude .acc-content { overflow: hidden; }
        .acesso-field { margin-bottom: 16px; }
        .acesso-field label.acesso-label { display: block; font-size: 0.75rem; text-transform: uppercase; color: #888; margin-bottom: 6px; font-weight: 600; }
        #acesso-especialidade, #acesso-email-ubs { display: block; width: 100%; max-width: 100%; min-width: 0; margin: 0; padding: 10px 12px; border: 1px solid #c4c4c4; border-radius: 4px; font-family: inherit; font-size: 0.9rem; background: #fff; color: #333; }
        #acesso-especialidade:focus, #acesso-email-ubs:focus { outline: 2px solid #1351b4; outline-offset: 1px; }
        .acesso-hint { font-size: 0.75rem; color: #9E9E9E; margin-top: 4px; }
        .acesso-hint.warn { color: #E65100; }
        .acesso-alert-box { background-color: #FFF3CD; border-left: 3px solid #FFA000; padding: 8px 10px; margin-top: 6px; border-radius: 3px; font-size: 0.75rem; color: #856404; line-height: 1.35; }
        .acesso-check { display: flex; gap: 10px; align-items: flex-start; cursor: pointer; font-size: 0.9rem; color: #333; line-height: 1.35; }
        .acesso-check input { width: 18px; height: 18px; margin: 1px 0 0 0; accent-color: #1351b4; flex-shrink: 0; cursor: pointer; }
        #acesso-solicitar { display: block; width: 100%; max-width: 100%; min-width: 0; height: auto; margin: 0; padding: 10px 16px; border: none; border-radius: 24px; background-color: #d32f2f; color: #ffffff; font-family: inherit; font-size: 0.9rem; font-weight: 600; line-height: 1.3; text-align: center; white-space: normal; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.15); transition: background-color 0.2s, transform 0.1s; }
        #acesso-solicitar:hover:not(:disabled) { background-color: #b71c1c; }
        #acesso-solicitar:active:not(:disabled) { transform: scale(0.98); }
        #acesso-solicitar:disabled { opacity: 0.7; cursor: wait; }
        #acesso-feedback { margin-top: 16px; padding: 12px 16px; border-radius: 4px; font-size: 0.85rem; display: none; word-break: break-word; }
        #acesso-feedback.success { display: block; background: #E8F5E9; border-left: 4px solid #4CAF50; color: #1B5E20; }
        #acesso-feedback.error { display: block; background: #FFEBEE; border-left: 4px solid #d32f2f; color: #b71c1c; }
        #acesso-feedback ul { margin: 8px 0 0 0; padding-left: 18px; }
        #acesso-feedback li { margin-bottom: 4px; }
        #acesso-payload-preview { background: #263238; color: #ECEFF1; font-size: 0.72rem; padding: 10px; border-radius: 4px; overflow-x: auto; margin: 0; max-height: 260px; }
      </style>

      <div style="background-color: #E3F2FD; border-left: 4px solid #1351b4; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px;">
        <h3 style="margin: 0 0 4px 0; color: #1351b4; font-size: 1rem;">🏥 Teleconsultoria — Acesso Saúde CE</h3>
        <p style="margin: 0; font-size: 0.85rem; color: #0D47A1;">Solicite parecer de especialista com os dados do paciente capturados do e-SUS.</p>
      </div>

      <details class="esus-accordion" open>
        <summary>Solicitação</summary>
        <div class="acc-content">
          <div class="acesso-field">
            <label class="acesso-label" for="acesso-especialidade">Especialidade</label>
            <select id="acesso-especialidade" disabled>
              <option value="">Carregando especialidades...</option>
            </select>
            <div id="acesso-especialidade-hint" class="acesso-hint"></div>
          </div>

          <div class="acesso-field">
            <label class="acesso-label" for="acesso-email-ubs">E-mail da Unidade Básica de Saúde (UBS)</label>
            <input 
              type="email" 
              id="acesso-email-ubs" 
              placeholder="ex.: ubs.centro@saude.ce.gov.br" 
              autocomplete="email"
            />
            <div class="acesso-alert-box">
              ⚠️ <strong>Atenção:</strong> O e-mail informado deve ser o da <strong>Unidade Básica de Saúde (UBS)</strong>, e não o e-mail pessoal.
            </div>
          </div>

          <div class="acesso-field">
            <label class="acesso-check" for="acesso-libras">
              <input type="checkbox" id="acesso-libras">
              <span>É necessário tradutor/intérprete de <strong>Libras</strong> para o atendimento?</span>
            </label>
          </div>

          <button id="acesso-solicitar" type="button">Solicitar especialista</button>
          <div id="acesso-feedback" role="status" aria-live="polite"></div>
        </div>
      </details>

      <details class="esus-accordion" id="acesso-payload-details">
        <summary>Dados que serão enviados</summary>
        <div class="acc-content">
          <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: #888;">Campos obrigatórios não identificados no e-SUS são enviados como "${NOT_FOUND}"; opcionais não identificados são omitidos.</p>
          <pre id="acesso-payload-preview"></pre>
        </div>
      </details>
    `;
  }

  function sendMessage(message) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: `Falha de comunicação com a extensão: ${chrome.runtime.lastError.message}` });
          } else {
            resolve(response);
          }
        });
      } catch (err) {
        // Ex.: "Extension context invalidated" após recarregar a extensão sem dar F5 no PEC
        resolve({ ok: false, error: `Falha de comunicação com a extensão: ${err.message}. Recarregue a página.` });
      }
    });
  }

  function populateSelect(select, especialidades) {
    select.innerHTML = "";
    const placeholder = new Option("Selecione a especialidade...", "");
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);
    [...new Set(especialidades)]
      .sort((a, b) => a.localeCompare(b, "pt-BR"))
      .forEach((nome) => select.appendChild(new Option(nome, nome)));
    select.disabled = false;
  }

  async function loadEspecialidades(root) {
    const select = root.querySelector("#acesso-especialidade");
    const hint = root.querySelector("#acesso-especialidade-hint");
    const response = await sendMessage({ type: "ACESSO_GET_ESPECIALIDADES" });

    if (response?.ok && response.especialidades?.length) {
      populateSelect(select, response.especialidades);
      hint.className = "acesso-hint";
      hint.textContent = `${response.especialidades.length} especialidades carregadas da API.`;
    } else {
      console.warn("[e-SUS Lens] GET /especialidades/ falhou, usando lista padrão:", response?.error);
      populateSelect(select, ESPECIALIDADES_PADRAO);
      hint.className = "acesso-hint warn";
      hint.textContent = `Lista padrão em uso (API: ${response?.error || "nenhuma especialidade retornada"}).`;
    }
  }

  function showFeedback(root, type, title, items = []) {
    const box = root.querySelector("#acesso-feedback");
    box.className = type;
    box.textContent = "";
    const strong = document.createElement("strong");
    strong.textContent = title;
    box.appendChild(strong);
    if (items.length) {
      const ul = document.createElement("ul");
      items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }
  }

  function currentPayload(root) {
    const emailInput = root.querySelector("#acesso-email-ubs");
    return buildTeleconsultoriaPayload(
      currentPatient,
      root.querySelector("#acesso-especialidade").value,
      root.querySelector("#acesso-libras").checked,
      emailInput ? emailInput.value : ""
    );
  }

  function refreshPreview(root) {
    const pre = root.querySelector("#acesso-payload-preview");
    if (pre) pre.textContent = JSON.stringify(currentPayload(root), null, 2);
  }

  async function submit(root) {
    const button = root.querySelector("#acesso-solicitar");
    const especialidade = root.querySelector("#acesso-especialidade").value;
    const emailInput = root.querySelector("#acesso-email-ubs");
    const emailUbs = emailInput ? emailInput.value.trim() : "";

    if (!especialidade) {
      showFeedback(root, "error", "Selecione uma especialidade antes de solicitar.");
      return;
    }

    if (!emailUbs) {
      showFeedback(root, "error", "Por favor, informe o e-mail da Unidade Básica de Saúde (UBS).");
      emailInput?.focus();
      return;
    }

    if (!EMAIL_REGEX.test(emailUbs)) {
      showFeedback(root, "error", "O e-mail da UBS informado é inválido. Verifique o formato digitado.");
      emailInput?.focus();
      return;
    }

    const payload = currentPayload(root);
    button.disabled = true;
    button.textContent = "Enviando solicitação...";
    root.querySelector("#acesso-feedback").className = "";

    try {
      const result = await sendMessage({ type: "ACESSO_SOLICITAR_TELECONSULTORIA", payload });
      if (result?.ok) {
        console.log("[e-SUS Lens] Teleconsultoria criada:", result.body);
        showFeedback(root, "success", "Consulta solicitada com sucesso!");
      } else {
        console.error("[e-SUS Lens] Falha ao solicitar teleconsultoria:", result);
        const { title, items } = describeError(result);
        showFeedback(root, "error", title, items);
      }
    } finally {
      button.disabled = false;
      button.textContent = "Solicitar especialista";
    }
  }

  /** Liga eventos da aba já inserida no DOM e carrega as especialidades. */
  function init(root) {
    root.querySelector("#acesso-solicitar").addEventListener("click", () => submit(root));
    root.querySelector("#acesso-especialidade").addEventListener("change", () => refreshPreview(root));
    root.querySelector("#acesso-libras").addEventListener("change", () => refreshPreview(root));
    root.querySelector("#acesso-email-ubs").addEventListener("input", () => refreshPreview(root));
    root.querySelector("#acesso-payload-details").addEventListener("toggle", () => refreshPreview(root));
    refreshPreview(root);
    loadEspecialidades(root);
  }

  /** Atualiza o paciente usado no payload (chamado a cada nova extração do Wasm). */
  function setPatient(patient) {
    currentPatient = patient || null;
    const sidebar = document.getElementById("esus-lens-sidebar");
    if (sidebar) refreshPreview(sidebar);
  }

  return { NOT_FOUND, tabHtml, init, setPatient, buildTeleconsultoriaPayload, describeError };
})();
