// scriba.js
// Aba "🎙️ Scriba" da sidebar (Ambient Clinical Scribe):
// 1) Escuta a consulta via Web Speech API (pt-BR) com auto-reconexão;
// 2) Envia a transcrição + contexto anônimo do paciente ao Gemini (background.js) para estruturar o SOAP;
// 3) Injeta Subjetivo / Objetivo / Avaliação / Plano nos editores Draft.js do e-SUS PEC e preenche o CIAP-2.
//
// O estado vive neste módulo (e não no DOM) porque a sidebar é recriada a cada nova extração do Wasm:
// a gravação continua e a tela é redesenhada a partir do estado em init().

const Scriba = (() => {
  const SECTIONS = [
    { key: "subjetivo", label: "Subjetivo", pattern: /^(s\s*[-–:]\s*)?subjetivo$/i },
    { key: "objetivo", label: "Objetivo", pattern: /^(o\s*[-–:]\s*)?objetivo$/i },
    { key: "avaliacao", label: "Avaliação", pattern: /^(a\s*[-–:]\s*)?avalia[cç][aã]o$/i },
    { key: "plano", label: "Plano", pattern: /^(p\s*[-–:]\s*)?plano$/i },
  ];

  const CIAP_INPUT_SELECTOR = 'input[data-testid="ProblemasCondicoesForm.ciap"], input[name="new.ciap"]';
  const DRAFT_EDITOR_SELECTOR = '.public-DraftEditor-content[contenteditable="true"]';

  const state = {
    patientKey: null,
    patient: null,
    recording: false,
    transcript: "",
    interim: "",
    startedAt: null,
    elapsedMs: 0,
    loading: false,
    result: null, // { subjetivo, objetivo, avaliacao, plano, ciap2Sugerido }
    requestToken: 0,
    feedback: null, // { type, title, items }
  };

  let recognition = null;
  let timerId = null;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const normalize = (s) => String(s || "").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
  const getRoot = () => document.getElementById("esus-lens-sidebar");
  const $ = (sel) => getRoot()?.querySelector(sel) || null;

  // ─── Reconhecimento de voz (baseado no scriba.js de referência, com correções) ──────

  function getRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    if (recognition) return recognition;

    recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "pt-BR";

    recognition.onresult = (event) => {
      if (!state.recording) return; // ignora áudio residual após parar
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0].transcript.trim();
        if (!text) continue;
        if (res.isFinal) {
          state.transcript = state.transcript ? `${state.transcript.replace(/\s+$/, "")} ${text}` : text;
        } else {
          interim += `${text} `;
        }
      }
      state.interim = interim.trim();
      renderTranscript();
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        state.recording = false;
        stopTimer();
        setFeedback("error", "Permissão de microfone negada.", [
          "Clique no ícone de cadeado na barra de endereço e permita o uso do microfone para este site.",
        ]);
        renderControls();
      } else if (event.error === "network") {
        setFeedback("warn", "Falha de rede no reconhecimento de voz. Tentando reconectar...");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("[e-SUS Lens Scriba] Erro no reconhecimento de voz:", event.error);
      }
    };

    // O Chrome encerra a escuta sozinho após silêncio/~60s: religa enquanto o médico não parar.
    recognition.onend = () => {
      if (!state.recording) return;
      setTimeout(() => {
        if (!state.recording) return;
        try { recognition.start(); } catch (_) { /* já iniciado */ }
      }, 250);
    };

    return recognition;
  }

  function startRecording() {
    const rec = getRecognition();
    if (!rec) {
      setFeedback("error", "Reconhecimento de voz indisponível neste navegador.", [
        "Use o Google Chrome atualizado ou digite/cole o relato na caixa de transcrição.",
      ]);
      return;
    }
    try { rec.abort(); } catch (_) { /* nada gravando */ }

    state.recording = true;
    state.interim = "";
    state.startedAt = Date.now();
    state.feedback = null;
    startTimer();

    setTimeout(() => {
      if (!state.recording) return;
      try { rec.start(); } catch (_) { /* já iniciado */ }
    }, 120);

    renderAll();
  }

  function stopRecording({ silent = false } = {}) {
    if (state.recording && state.startedAt) {
      state.elapsedMs += Date.now() - state.startedAt;
    }
    state.recording = false;
    state.startedAt = null;
    stopTimer();

    // Não perde o trecho que ainda estava "interino" quando o médico clicou em parar
    if (state.interim) {
      state.transcript = state.transcript ? `${state.transcript} ${state.interim}` : state.interim;
      state.interim = "";
    }

    if (recognition) {
      try { recognition.stop(); } catch (_) { /* ok */ }
    }
    if (!silent) renderAll();
  }

  function startTimer() {
    stopTimer();
    timerId = setInterval(renderTimer, 1000);
  }

  function stopTimer() {
    if (timerId) clearInterval(timerId);
    timerId = null;
  }

  function formatElapsed() {
    const total = state.elapsedMs + (state.recording && state.startedAt ? Date.now() - state.startedAt : 0);
    const sec = Math.floor(total / 1000);
    return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  }

  // ─── Contexto anônimo do paciente (LGPD: sem nome, CPF, CNS, endereço) ──────────────

  function buildContextoPaciente(p) {
    if (!p) return {};
    const condicoes = Object.entries(p.condicoes_saude || {})
      .filter(([, v]) => v === true)
      .map(([k]) => k.replace(/_/g, " "))
      .join(", ");
    return {
      idade: p.age || null,
      sexo: p.sex || null,
      isPregnant: p.is_pregnant === true,
      idadeGestacional: p.idade_gestacional_dias
        ? `${Math.floor(p.idade_gestacional_dias / 7)} semanas`
        : null,
      condicoesSaude: condicoes || null,
    };
  }

  // ─── Geração do SOAP via Gemini ─────────────────────────────────────────────────────

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
        resolve({ ok: false, error: `Falha de comunicação com a extensão: ${err.message}. Recarregue a página.` });
      }
    });
  }

  async function generateSoap() {
    if (state.recording) stopRecording({ silent: true });

    const transcricao = normalize(state.transcript);
    if (!transcricao) {
      setFeedback("error", "Nenhum relato capturado.", ["Grave a consulta ou digite/cole o relato antes de gerar o SOAP."]);
      renderAll();
      return;
    }

    const token = ++state.requestToken;
    const patientKeyAtStart = state.patientKey;
    state.loading = true;
    state.feedback = null;
    renderAll();

    const response = await sendMessage({
      type: "GEMINI_ESTRUTURAR_SOAP_SCRIBA",
      payload: { transcricao, contextoPaciente: buildContextoPaciente(state.patient) },
    });

    // Trava anti-vazamento: se o médico trocou de paciente enquanto a IA processava, descarta.
    if (token !== state.requestToken || patientKeyAtStart !== state.patientKey) {
      console.log("[e-SUS Lens Scriba] Resposta descartada: paciente mudou durante o processamento.");
      return;
    }

    state.loading = false;
    if (response?.ok && response.data) {
      const d = response.data;
      state.result = {
        subjetivo: d.subjetivo || "",
        objetivo: d.objetivo || "",
        avaliacao: d.avaliacao || "",
        plano: d.plano || "",
        ciap2Sugerido: d.ciap2Sugerido || null,
      };
      setFeedback("success", "SOAP estruturado. Revise o texto antes de inserir no prontuário.");
    } else {
      setFeedback("error", `Não foi possível gerar o SOAP: ${response?.error || "sem resposta"}`);
    }
    renderAll();
  }

  // ─── Localização dos editores Draft.js do SOAP no PEC ───────────────────────────────

  function getDraftEditors() {
    return [...document.querySelectorAll(DRAFT_EDITOR_SELECTOR)].filter(
      (el) => !el.closest("#esus-lens-sidebar") && el.getClientRects().length > 0
    );
  }

  /** Elementos-rótulo cujo texto é exatamente "Subjetivo", "Objetivo", etc. (fora dos editores e da sidebar). */
  function findLabelElements(pattern) {
    const labels = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest("#esus-lens-sidebar, .DraftEditor-root, script, style")) return NodeFilter.FILTER_REJECT;
        return pattern.test(normalize(node.textContent)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });
    while (walker.nextNode()) labels.push(walker.currentNode.parentElement);
    return labels;
  }

  const isAfter = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

  /**
   * Mapeia cada seção ao editor mais próximo depois do seu rótulo. Entre vários rótulos iguais
   * (ex.: menu lateral + título do campo), vence o último antes do editor. Se não houver rótulo,
   * cai para a ordem dos editores na página (S, O, A, P).
   */
  function findSoapEditors() {
    const editors = getDraftEditors();
    const used = new Set();
    const map = {};

    for (const section of SECTIONS) {
      let best = null;
      for (const label of findLabelElements(section.pattern)) {
        const editor = editors.find((ed) => !used.has(ed) && isAfter(label, ed));
        if (!editor) continue;
        if (!best || isAfter(best.label, label)) best = { label, editor };
      }
      if (best) {
        map[section.key] = { editor: best.editor, byPosition: false };
        used.add(best.editor);
      }
    }

    SECTIONS.forEach((section, idx) => {
      if (map[section.key]) return;
      const fallback = editors[idx];
      if (editors.length >= SECTIONS.length && fallback && !used.has(fallback)) {
        map[section.key] = { editor: fallback, byPosition: true };
        used.add(fallback);
      }
    });

    return map;
  }

  // ─── Injeção de texto em editor Draft.js (React) ────────────────────────────────────

  function placeCaret(editor, replace) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    if (!replace) range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
  }

  async function insertIntoDraftEditor(editor, text, { replace = false } = {}) {
    const clean = String(text || "").trim();
    if (!clean) return false;

    editor.scrollIntoView({ block: "center", behavior: "instant" });
    editor.focus();
    await sleep(40);
    placeCaret(editor, replace);
    await sleep(40);

    const existing = normalize(editor.textContent);
    const toInsert = !replace && existing ? `\n${clean}` : clean;
    const probe = normalize(clean).slice(0, 40);
    const inserted = () => normalize(editor.textContent).includes(probe);

    // 1º: evento de colar (o Draft.js converte cada quebra de linha em um bloco)
    try {
      const dt = new DataTransfer();
      dt.setData("text/plain", toInsert);
      editor.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
      await sleep(80);
      if (inserted()) return true;
    } catch (err) {
      console.warn("[e-SUS Lens Scriba] Paste sintético falhou, tentando insertText:", err);
    }

    // 2º: insertText nativo (dispara beforeinput, que o Draft.js também trata)
    editor.focus();
    placeCaret(editor, replace);
    await sleep(40);
    document.execCommand("insertText", false, toInsert);
    await sleep(80);
    return inserted();
  }

  async function fillSections(keys) {
    if (!state.result) return;
    const replace = Boolean($("#scriba-replace")?.checked);
    const editorsMap = findSoapEditors();
    const ok = [];
    const problems = [];

    for (const key of keys) {
      const section = SECTIONS.find((s) => s.key === key);
      const text = state.result[key];
      if (!text || !text.trim()) continue;

      const target = editorsMap[key];
      if (!target) {
        problems.push(`${section.label}: campo não encontrado na tela. Abra a aba SOAP do atendimento.`);
        continue;
      }
      const success = await insertIntoDraftEditor(target.editor, text, { replace });
      if (success) {
        ok.push(target.byPosition ? `${section.label} (localizado pela posição — confira)` : section.label);
      } else {
        problems.push(`${section.label}: o editor não aceitou o texto. Use o botão 📋 e cole manualmente.`);
      }
    }

    if (problems.length) {
      setFeedback(ok.length ? "warn" : "error",
        ok.length ? `Inserido em: ${ok.join(", ")}.` : "Nenhum campo foi preenchido.", problems);
    } else if (ok.length) {
      setFeedback("success", `Inserido no PEC: ${ok.join(", ")}.`);
    } else {
      setFeedback("warn", "Não há texto para inserir nos campos selecionados.");
    }
    renderFeedback();
  }

  // ─── Preenchimento do CIAP-2 (autocomplete Downshift do PEC) ────────────────────────

  function setNativeInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function getAutocompleteItems(input) {
    const base = (input.id || "").replace(/-input$/, "");
    const menuId = input.getAttribute("aria-controls") || (base ? `${base}-menu` : null);
    const menu = menuId ? document.getElementById(menuId) : null;
    let items = menu ? [...menu.querySelectorAll('[role="option"]')] : [];
    if (!items.length && base) items = [...document.querySelectorAll(`[id^="${base}-item-"]`)];
    return items;
  }

  async function waitForItems(input, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const items = getAutocompleteItems(input);
      if (items.length) return items;
      await sleep(150);
    }
    return [];
  }

  async function fillCiap() {
    const ciap = state.result?.ciap2Sugerido;
    const codigo = normalize(ciap?.codigo).toUpperCase();
    if (!codigo) {
      setFeedback("warn", "A IA não sugeriu um código CIAP-2 para esta consulta.");
      renderFeedback();
      return;
    }

    const input = document.querySelector(CIAP_INPUT_SELECTOR);
    if (!input) {
      setFeedback("error", "Campo CIAP-2 não encontrado.", [
        "Na Avaliação, abra \"Problemas e/ou condições avaliados neste atendimento\" e clique em adicionar.",
      ]);
      renderFeedback();
      return;
    }
    if (input.disabled || input.readOnly) {
      setFeedback("warn", "O campo CIAP-2 está bloqueado no PEC.", [input.title || "Adicione um novo problema/condição para liberar o campo."]);
      renderFeedback();
      return;
    }

    input.scrollIntoView({ block: "center", behavior: "instant" });
    input.focus();

    const termos = [codigo, normalize(ciap?.termoBusca), normalize(ciap?.descricao)].filter(Boolean);
    for (const termo of [...new Set(termos)]) {
      setNativeInputValue(input, termo);
      const items = await waitForItems(input, 3000);
      if (!items.length) continue;

      const codeRegex = new RegExp(`\\b${codigo}\\b`, "i");
      const match = items.find((it) => codeRegex.test(normalize(it.textContent)));
      if (match) {
        match.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
        match.click();
        setFeedback("success", `CIAP-2 selecionado: ${normalize(match.textContent)}. O CID-10 é sugerido pelo PEC.`);
        renderFeedback();
        return;
      }
    }

    setFeedback("warn", `CIAP-2 ${codigo} digitado, mas não foi possível selecionar automaticamente.`, [
      "Escolha a opção correta na lista do PEC.",
    ]);
    renderFeedback();
  }

  // ─── Feedback e renderização ────────────────────────────────────────────────────────

  function setFeedback(type, title, items = []) {
    state.feedback = { type, title, items };
  }

  function renderFeedback() {
    const box = $("#scriba-feedback");
    if (!box) return;
    box.className = "";
    box.textContent = "";
    if (!state.feedback) return;
    box.className = state.feedback.type;
    const strong = document.createElement("strong");
    strong.textContent = state.feedback.title;
    box.appendChild(strong);
    if (state.feedback.items?.length) {
      const ul = document.createElement("ul");
      state.feedback.items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
      box.appendChild(ul);
    }
  }

  function renderTimer() {
    const el = $("#scriba-timer");
    if (el) el.textContent = formatElapsed();
  }

  function renderTranscript() {
    const ta = $("#scriba-transcript");
    if (!ta) return;
    const full = state.interim ? `${state.transcript} ${state.interim}`.trim() : state.transcript;
    if (ta.value !== full) ta.value = full;
    ta.readOnly = state.recording;
    if (state.recording) ta.scrollTop = ta.scrollHeight;
  }

  function renderControls() {
    const supported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
    const btnRec = $("#scriba-btn-record");
    const btnGen = $("#scriba-btn-generate");
    const status = $("#scriba-status");
    const btnClear = $("#scriba-btn-clear");

    if (btnRec) {
      btnRec.disabled = !supported || state.loading;
      btnRec.textContent = state.recording ? "⏸️ Pausar escuta" : (state.transcript ? "🎙️ Continuar escuta" : "🎙️ Iniciar escuta");
      btnRec.classList.toggle("recording", state.recording);
    }
    if (btnGen) {
      btnGen.disabled = state.loading;
      btnGen.textContent = state.loading ? "⏳ Estruturando SOAP..." : "✨ Gerar SOAP com IA";
    }
    if (btnClear) btnClear.disabled = state.loading || state.recording;
    if (status) {
      status.innerHTML = !supported
        ? '<span class="scriba-dot off"></span> Microfone indisponível — digite o relato'
        : state.recording
          ? '<span class="scriba-dot on"></span> Ouvindo consulta... <span id="scriba-timer"></span>'
          : `<span class="scriba-dot off"></span> Escuta parada${state.elapsedMs ? ' · <span id="scriba-timer"></span>' : ""}`;
    }
    renderTimer();
  }

  function renderResult() {
    const box = $("#scriba-result");
    if (!box) return;
    box.style.display = state.result ? "block" : "none";
    if (!state.result) return;

    SECTIONS.forEach((s) => {
      const ta = $(`#scriba-out-${s.key}`);
      if (ta && document.activeElement !== ta) ta.value = state.result[s.key] || "";
    });

    const ciap = state.result.ciap2Sugerido;
    const badge = $("#scriba-ciap-badge");
    const ciapRow = $("#scriba-ciap-row");
    if (ciapRow) ciapRow.style.display = ciap?.codigo ? "flex" : "none";
    if (badge && ciap?.codigo) badge.textContent = `${ciap.codigo} — ${ciap.descricao || ciap.termoBusca || ""}`;
  }

  function renderAll() {
    renderControls();
    renderTranscript();
    renderResult();
    renderFeedback();
  }

  // ─── HTML da aba ────────────────────────────────────────────────────────────────────

  function tabHtml() {
    const sectionCards = SECTIONS.map((s) => `
      <div class="scriba-section">
        <div class="scriba-section-head">
          <span>${s.label}</span>
          <span>
            <button type="button" class="scriba-mini" data-scriba-copy="${s.key}" title="Copiar">📋</button>
            <button type="button" class="scriba-mini primary" data-scriba-fill="${s.key}" title="Inserir no PEC">⚡ Inserir</button>
          </span>
        </div>
        <textarea id="scriba-out-${s.key}" data-scriba-edit="${s.key}" rows="3"></textarea>
      </div>
    `).join("");

    return `
      <style>
        #tab-scriba, #tab-scriba * { box-sizing: border-box; }
        #tab-scriba .scriba-hero { background: #EDE7F6; border-left: 4px solid #5E35B1; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px; }
        #tab-scriba .scriba-hero h3 { margin: 0 0 4px 0; color: #4527A0; font-size: 1rem; }
        #tab-scriba .scriba-hero p { margin: 0; font-size: 0.8rem; color: #4527A0; }
        #tab-scriba .scriba-status { font-size: 0.78rem; color: #555; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        #tab-scriba .scriba-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
        #tab-scriba .scriba-dot.on { background: #d32f2f; animation: scribaPulse 1s infinite; }
        #tab-scriba .scriba-dot.off { background: #bdbdbd; }
        @keyframes scribaPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        #tab-scriba .scriba-row { display: flex; gap: 8px; margin-bottom: 10px; }
        #tab-scriba .scriba-btn { flex: 1; padding: 9px 10px; border: none; border-radius: 20px; font-family: inherit; font-size: 0.82rem; font-weight: 600; cursor: pointer; background: #5E35B1; color: #fff; }
        #tab-scriba .scriba-btn.recording { background: #d32f2f; }
        #tab-scriba .scriba-btn.secondary { background: #ECEFF1; color: #37474F; flex: 0 0 auto; }
        #tab-scriba .scriba-btn.generate { background: #1351b4; }
        #tab-scriba .scriba-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        #tab-scriba textarea { width: 100%; border: 1px solid #c4c4c4; border-radius: 4px; padding: 8px 10px; font-family: inherit; font-size: 0.82rem; color: #333; resize: vertical; background: #fff; }
        #tab-scriba #scriba-transcript { min-height: 120px; }
        #tab-scriba #scriba-transcript[readonly] { background: #FAFAFA; }
        #tab-scriba .scriba-hint { font-size: 0.72rem; color: #9E9E9E; margin: 4px 0 12px 0; }
        #tab-scriba .scriba-section { background: #fff; border: 1px solid #E0E0E0; border-radius: 6px; padding: 8px 10px; margin-bottom: 8px; }
        #tab-scriba .scriba-section-head { display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #1351b4; margin-bottom: 6px; }
        #tab-scriba .scriba-mini { border: 1px solid #c4c4c4; background: #fff; border-radius: 4px; padding: 2px 8px; font-size: 0.72rem; cursor: pointer; }
        #tab-scriba .scriba-mini.primary { background: #1351b4; color: #fff; border-color: #1351b4; }
        #tab-scriba #scriba-ciap-row { display: none; align-items: center; justify-content: space-between; gap: 8px; background: #E3F2FD; border-radius: 6px; padding: 8px 10px; margin-bottom: 10px; font-size: 0.8rem; }
        #tab-scriba #scriba-ciap-badge { font-weight: 600; color: #0D47A1; }
        #tab-scriba .scriba-check { display: flex; gap: 8px; align-items: center; font-size: 0.78rem; color: #555; margin: 6px 0 10px 0; cursor: pointer; }
        #tab-scriba #scriba-feedback { margin-top: 12px; padding: 10px 12px; border-radius: 4px; font-size: 0.8rem; display: none; word-break: break-word; }
        #tab-scriba #scriba-feedback.success { display: block; background: #E8F5E9; border-left: 4px solid #4CAF50; color: #1B5E20; }
        #tab-scriba #scriba-feedback.warn { display: block; background: #FFF8E1; border-left: 4px solid #FFA000; color: #795548; }
        #tab-scriba #scriba-feedback.error { display: block; background: #FFEBEE; border-left: 4px solid #d32f2f; color: #b71c1c; }
        #tab-scriba #scriba-feedback ul { margin: 6px 0 0 0; padding-left: 18px; }
      </style>

      <div class="scriba-hero">
        <h3>🎙️ Scriba — Escuta da Consulta</h3>
        <p>Grave a conversa, gere o SOAP com IA, revise e insira direto no prontuário.</p>
      </div>

      <div id="scriba-status" class="scriba-status"></div>
      <div class="scriba-row">
        <button type="button" id="scriba-btn-record" class="scriba-btn">🎙️ Iniciar escuta</button>
        <button type="button" id="scriba-btn-clear" class="scriba-btn secondary" title="Limpar transcrição e resultado">🗑️</button>
      </div>

      <textarea id="scriba-transcript" placeholder="A transcrição aparece aqui em tempo real. Com a escuta parada, você pode editar ou digitar o relato."></textarea>
      <div class="scriba-hint">Informe o paciente antes de gravar. Nome e CPF não são enviados à IA.</div>

      <div class="scriba-row">
        <button type="button" id="scriba-btn-generate" class="scriba-btn generate">✨ Gerar SOAP com IA</button>
      </div>

      <div id="scriba-result" style="display: none;">
        ${sectionCards}
        <div id="scriba-ciap-row">
          <span>CIAP-2 sugerido: <span id="scriba-ciap-badge"></span></span>
          <button type="button" id="scriba-btn-ciap" class="scriba-mini primary">⚡ Preencher CIAP</button>
        </div>
        <label class="scriba-check"><input type="checkbox" id="scriba-replace"> Substituir o texto já existente nos campos do PEC</label>
        <div class="scriba-row">
          <button type="button" id="scriba-btn-fill-all" class="scriba-btn">⚡ Preencher todo o SOAP no PEC</button>
        </div>
      </div>

      <div id="scriba-feedback" role="status" aria-live="polite"></div>
    `;
  }

  /** Liga eventos da aba (chamado a cada recriação da sidebar) e redesenha a partir do estado. */
  function init(root) {
    root.querySelector("#scriba-btn-record")?.addEventListener("click", () => {
      state.recording ? stopRecording() : startRecording();
    });
    root.querySelector("#scriba-btn-clear")?.addEventListener("click", () => {
      state.transcript = "";
      state.interim = "";
      state.elapsedMs = 0;
      state.result = null;
      state.feedback = null;
      renderAll();
    });
    root.querySelector("#scriba-transcript")?.addEventListener("input", (e) => {
      if (!state.recording) state.transcript = e.target.value;
    });
    root.querySelector("#scriba-btn-generate")?.addEventListener("click", generateSoap);
    root.querySelector("#scriba-btn-fill-all")?.addEventListener("click", () => fillSections(SECTIONS.map((s) => s.key)));
    root.querySelector("#scriba-btn-ciap")?.addEventListener("click", fillCiap);

    root.querySelectorAll("[data-scriba-edit]").forEach((ta) => {
      ta.addEventListener("input", () => {
        if (state.result) state.result[ta.dataset.scribaEdit] = ta.value;
      });
    });
    root.querySelectorAll("[data-scriba-fill]").forEach((btn) => {
      btn.addEventListener("click", () => fillSections([btn.dataset.scribaFill]));
    });
    root.querySelectorAll("[data-scriba-copy]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const text = state.result?.[btn.dataset.scribaCopy] || "";
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = "✓";
        } catch (_) {
          btn.textContent = "✗";
        }
        setTimeout(() => { btn.textContent = "📋"; }, 1200);
      });
    });

    renderAll();
  }

  /** Atualiza o paciente atual. Se mudou de paciente, para a escuta e limpa tudo (anti-vazamento). */
  function setPatient(patient) {
    const key = patient ? (patient.cpf || patient.id || patient.name || null) : null;
    if (state.patientKey && key && key !== state.patientKey) {
      console.log("[e-SUS Lens Scriba] Troca de paciente detectada: escuta encerrada e buffer limpo.");
      stopRecording({ silent: true });
      state.transcript = "";
      state.interim = "";
      state.elapsedMs = 0;
      state.result = null;
      state.loading = false;
      state.requestToken++; // invalida respostas pendentes do Gemini
      state.feedback = null;
    }
    if (key) state.patientKey = key;
    state.patient = patient || null;
  }

  return { tabHtml, init, setPatient, isRecording: () => state.recording };
})();

