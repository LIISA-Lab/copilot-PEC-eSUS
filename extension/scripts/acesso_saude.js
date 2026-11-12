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
    "Dermatologia",
    "Infectologia",
    "Cirurgia Geral",
    "Endocrinologia",
    "Hematologia",
    "Gastroenterologia",
    "PEP",
    "PrEP",
    "Otorrinolaringologia",
    "Medicina de Família e Comunidade",
    "Geriatria",
    "Cirurgia Vascular",
    "Laudo Cardiologista (ECG)",
    "Oftalmologia",
    "Psiquiatria",
    "Intensivista",
    "Gineco-Obstetricia",
    "Pediatria",
    "Pneumologia",
    "Ortopedia",
    "Nefrologia",
    "Reumatologia",
    "Mastologia",
    "Odontologia - Teleconsultoria"
  ];

  // Tradução das mensagens mais comuns de validação do FastAPI/Pydantic
  const PYDANTIC_MSGS = {
    "Field required": "campo obrigatório ausente",
  };

  // ⚠ VALORES DE TESTE — campos que o e-SUS PEC (struct Patient) não fornece.
  // emailUsuario agora é informado pelo profissional na aba da UBS.
  const VALORES_TESTE = {
    modalidade: "TELECONSULTA",
    // orgaoExpedidorRegistro: "CRM",
    // numeroRegistro: "12345",
    // uFRegistro: "CE",
    // estabelecimento: "1234567", // CNES
    // municipioUbs: "Fortaleza", // usado se o município do paciente não for identificado
    // pergunta: "Teste de integração e-SUS PEC Lens: solicitação de teleconsultoria com especialista.",
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

  function buildPergunta(patient) {
    // 1. Tenta pegar do objeto patient consolidado pelo Wasm
    let ev = patient?.evolucao_pre_natal;

    // 2. Fallback direto do localStorage (caso o Wasm ainda não tenha sido recompilado)
    if (!ev && typeof localStorage !== "undefined") {
      try {
        const raw = localStorage.getItem("__ESUS_GRAPHQL_DATA__");
        if (raw) {
          const parsed = JSON.parse(raw);
          ev = parsed?.patient_info?.evolucao_pre_natal;
        }
      } catch (e) {
        console.warn("[AcessoSaude] Falha ao ler evolucao_pre_natal do localStorage:", e);
      }
    }

    if (!ev) return NOT_FOUND;

    // Concatena dinamicamente os blocos que estiverem presentes
    // (ex.: aceita Subjetivo + Avaliação, ou todos preenchidos)
    const blocos = [];
    if (clean(ev.subjetivo)) blocos.push(`[Subjetivo]\n${clean(ev.subjetivo)}`);
    if (clean(ev.objetivo)) blocos.push(`[Objetivo]\n${clean(ev.objetivo)}`);
    if (clean(ev.avaliacao)) blocos.push(`[Avaliação]\n${clean(ev.avaliacao)}`);
    if (clean(ev.problema)) blocos.push(`[Problema/Condição]\n${clean(ev.problema)}`);

    return blocos.length > 0 ? blocos.join("\n\n") : NOT_FOUND;
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
      pergunta: buildPergunta(p),

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

  // ─── Tutelamento Clínico e Validação de Completude (Frente 1) ──────────────

  /**
   * Avalia a qualidade e completude dos dados capturados do paciente e do atendimento,
   * gerando diagnósticos com orientações claras para o profissional de saúde.
   */
  function avaliarCompletude(patient, emailUbs, especialidade) {
    const p = patient || {};
    const end = p.endereco || {};
    const ev = p.evolucao_pre_natal || {};
    const session = p.session_info || {};

    const checks = [
      {
        id: "identificacao",
        titulo: "Identificação básica do Cidadão",
        ok: Boolean(clean(p.name) && clean(p.cpf) && clean(p.mother_name)),
        detalhe: clean(p.name) && clean(p.cpf)
          ? `${p.name} (CPF: ${p.cpf})`
          : "Falta nome, CPF ou nome da mãe. Verifique o cadastro básico do cidadão.",
        critico: true,
      },
      {
        id: "endereco",
        titulo: "Endereço e CEP residencial",
        ok: Boolean(clean(end.cep) && clean(end.bairro) && clean(end.municipio?.nome)),
        detalhe: clean(end.cep) && clean(end.municipio?.nome)
          ? `${end.logradouro || "Logradouro"}, ${end.bairro || ""} — CEP: ${end.cep}`
          : "Endereço incompleto no e-SUS. O teleconsultor precisa do CEP e Bairro do paciente para direcionamento territorial.",
        critico: true,
      },
      {
        id: "evolucao_soap",
        titulo: "Registro clínico da consulta (SOAP)",
        ok: Boolean(clean(ev.subjetivo) || clean(ev.avaliacao) || clean(ev.objetivo) || clean(ev.problema)),
        detalhe: (clean(ev.subjetivo) || clean(ev.avaliacao))
          ? `Registro clínico identificado: ${[clean(ev.subjetivo) ? "Subjetivo" : null, clean(ev.objetivo) ? "Objetivo" : null, clean(ev.avaliacao) ? "Avaliação" : null, clean(ev.problema) ? "Problema" : null].filter(Boolean).join(" + ")}.`
          : "Nenhuma evolução clínica registrada ainda. Preencha ao menos o Subjetivo e/ou a Avaliação para embasar o caso clínico.",
        critico: true,
      },
      {
        id: "email_ubs",
        titulo: "E-mail oficial da UBS",
        ok: Boolean(emailUbs && EMAIL_REGEX.test(emailUbs)),
        detalhe: emailUbs && EMAIL_REGEX.test(emailUbs)
          ? `${emailUbs}`
          : "Informe o e-mail institucional da UBS para recebimento do laudo e retorno.",
        critico: true,
      },
      {
        id: "especialidade",
        titulo: "Especialidade médica de destino",
        ok: Boolean(clean(especialidade)),
        detalhe: clean(especialidade)
          ? `Especialidade selecionada: ${especialidade}`
          : "Selecione para qual especialidade a dúvida deve ser encaminhada.",
        critico: true,
      },
    ];

    // Exibe o checklist obstétrico apenas quando a paciente for gestante
    if (p.is_pregnant === true) {
      checks.push({
        id: "obstetrico",
        titulo: "Contexto obstétrico (DUM / Idade Gestacional)",
        ok: Boolean(p.ultima_dum || p.idade_gestacional_dias),
        detalhe: p.ultima_dum || p.idade_gestacional_dias
          ? `DUM: ${p.ultima_dum || "Sem DUM"} | Idade gestacional registrada`
          : "Sem DUM ou Idade Gestacional registradas. Importante para o teleconsultor obstétrico.",
        critico: false,
      });
    }

    const criticosPendentes = checks.filter((c) => c.critico && !c.ok);
    const avisosPendentes = checks.filter((c) => !c.critico && !c.ok);

    return {
      checks,
      prontoParaEnvio: criticosPendentes.length === 0,
      totalCriticos: checks.filter((c) => c.critico).length,
      sucessos: checks.filter((c) => c.ok).length,
      criticosPendentes,
      avisosPendentes,
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

      <!-- HISTÓRICO DE TELEMEDICINA (ACESSO SAÚDE CE) -->
      <details class="esus-accordion" id="acesso-prontuario-details" open>
        <summary>
          <span>📜 Histórico de Telemedicina</span>
          <span id="acesso-prontuario-badge" style="font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; font-weight: 600; background: #E3F2FD; color: #1351b4;">Consultando...</span>
        </summary>
        <div class="acc-content" style="padding: 12px 16px; background-color: #fafafa;">
          <div id="acesso-prontuario-container">
            <p style="margin: 0; font-size: 0.8rem; color: #888;">Aguardando identificação do paciente...</p>
          </div>
        </div>
      </details>

      <!-- PAINEL DE TUTELAMENTO E COMPLETUDE (FRENTE 1) -->
      <details class="esus-accordion" id="acesso-tutelamento-details" open>
        <summary>
          <span>🎯 Checklist de Envio</span>
          <span id="acesso-checklist-badge" style="font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; font-weight: 600; background: #FFF3CD; color: #856404;">Pendente</span>
        </summary>
        <div class="acc-content" style="padding: 12px 16px; background-color: #fafafa;">
          <p style="margin: 0 0 10px 0; font-size: 0.8rem; color: #555;">
            Para garantir que a solicitação seja aceita e qualificada pelo teleconsultor, certifique-se de que os itens abaixo estão preenchidos:
          </p>
          <div id="acesso-checklist-container">
            <!-- Gerado dinamicamente por renderChecklist -->
          </div>
        </div>
      </details>

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

  function formatUnixTimestampPtBr(timestamp) {
    if (!timestamp) return "Data não inf.";
    try {
      // Converte segundos float (ex: 1793903625.181718) ou milissegundos para Date
      const ms = timestamp < 1e11 ? timestamp * 1000 : timestamp;
      const date = new Date(ms);
      if (isNaN(date.getTime())) return "Data inválida";
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(timestamp);
    }
  }

  async function loadProntuarioTelemedicina(root, cpf) {
    const container = root.querySelector("#acesso-prontuario-container");
    const badge = root.querySelector("#acesso-prontuario-badge");
    if (!container) return;

    if (!cpf) {
      if (badge) {
        badge.style.background = "#EEEEEE";
        badge.style.color = "#666666";
        badge.textContent = "Sem CPF";
      }
      container.innerHTML = `<p style="margin: 0; font-size: 0.8rem; color: #888;">CPF não identificado para consultar histórico de Telemedicina.</p>`;
      return;
    }

    if (badge) {
      badge.style.background = "#E3F2FD";
      badge.style.color = "#1351b4";
      badge.textContent = "Consultando...";
    }
    container.innerHTML = `<p style="margin: 0; font-size: 0.8rem; color: #666;">Buscando histórico na plataforma Acesso Saúde CE...</p>`;

    try {
      const response = await sendMessage({ type: "ACESSO_GET_PRONTUARIO", cpf });

      if (!response?.ok) {
        if (badge) {
          badge.style.background = "#FFF3CD";
          badge.style.color = "#856404";
          badge.textContent = "Indisponível";
        }
        container.innerHTML = `
          <div style="font-size: 0.8rem; color: #856404;">
            Não foi possível carregar o histórico de telemedicina (${response?.error || `HTTP ${response?.status}`}).
          </div>
        `;
        return;
      }

      const body = response.body;
      const registros = Array.isArray(body)
        ? body
        : Array.isArray(body?.registros)
        ? body.registros
        : Array.isArray(body?.atendimentos)
        ? body.atendimentos
        : Array.isArray(body?.itens)
        ? body.itens
        : (body && typeof body === "object" && Object.keys(body).length > 0 ? [body] : []);

      if (registros.length === 0) {
        if (badge) {
          badge.style.background = "#E8F5E9";
          badge.style.color = "#2E7D32";
          badge.textContent = "0 registros";
        }
        container.innerHTML = `
          <div style="font-size: 0.8rem; color: #2E7D32; background: #E8F5E9; padding: 8px 10px; border-radius: 4px;">
            Nenhum atendimento ou teleconsultoria prévia localizada para este paciente.
          </div>
        `;
        return;
      }

      if (badge) {
        badge.style.background = "#E8F5E9";
        badge.style.color = "#2E7D32";
        badge.textContent = `${registros.length} consulta(s)`;
      }

      // Ordena do mais recente para o mais antigo (último pro primeiro)
      const registrosOrdenados = [...registros].sort((a, b) => {
        const timeA = Number(a.data_hora_fim || a.data_hora || a.data || 0);
        const timeB = Number(b.data_hora_fim || b.data_hora || b.data || 0);
        return timeB - timeA;
      });

      container.innerHTML = registrosOrdenados
        .map((item, idx) => {
          // Extrai data_hora_fim (ou fallback para data_hora) e converte unix timestamp para pt-BR
          const rawTimestamp = item.data_hora_fim || item.data_hora || item.data;
          const dataAtendimento = typeof rawTimestamp === "number"
            ? formatUnixTimestampPtBr(rawTimestamp)
            : (rawTimestamp || "Data não inf.");

          // Especialidade (médico -> perfil_medico -> especialidade)
          const especialidade = item.medico?.perfil_medico?.especialidade
            || item.especialidade
            || item.especialidade_nome
            || "Médico Geral";

          const status = item.status || item.situacao || "Finalizado";

          // Nome completo do Teleconsultor (médico -> nome_completo)
          const profissional = item.medico?.nome_completo
            || item.profissional
            || item.nome_profissional
            || null;

          // Prontuário / Conduta / Hipótese diagnóstica / Anamnese / Observações
          const prontuario = item.prontuario || {};
          const conduta = prontuario.conduct || prontuario.conduta || item.parecer || null;
          const hipotese = prontuario.diagnosticHypothesis || prontuario.hipotese || null;
          const anamnese = prontuario.anamnese || null;
          const observations = prontuario.observations || prontuario.observacoes || null;

          return `
            <div style="border: 1px solid #E0E0E0; background: #FFFFFF; border-radius: 6px; padding: 10px; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <strong style="color: #1351b4; font-size: 0.85rem;">🩺 ${especialidade}</strong>
                <span style="font-size: 0.7rem; background: #EDE7F6; color: #512DA8; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase;">${status}</span>
              </div>
              <div style="font-size: 0.75rem; color: #555; margin-bottom: 4px; line-height: 1.4;">
                📅 <strong>Data:</strong> ${dataAtendimento}
                ${profissional ? `<br>👨‍⚕️ <strong>Profissional:</strong> ${profissional}` : ""}
              </div>
              ${anamnese ? `
                <div style="margin-top: 6px; padding: 5px 8px; background: #F1F8E9; border-left: 3px solid #7CB342; border-radius: 2px; font-size: 0.75rem; color: #33691E; line-height: 1.35;">
                  <strong>Anamnese:</strong><br>${anamnese.replace(/\n/g, '<br>')}
                </div>
              ` : ""}
              ${observations ? `
                <div style="margin-top: 6px; padding: 5px 8px; background: #E0F2F1; border-left: 3px solid #00897B; border-radius: 2px; font-size: 0.75rem; color: #004D40; line-height: 1.35;">
                  <strong>Observações Clínicas:</strong><br>${observations.replace(/\n/g, '<br>')}
                </div>
              ` : ""}
              ${hipotese ? `
                <div style="margin-top: 6px; padding: 5px 8px; background: #FFF8E1; border-left: 3px solid #FFA000; border-radius: 2px; font-size: 0.75rem; color: #795548; line-height: 1.35;">
                  <strong>Hipótese Diagnóstica:</strong><br>${hipotese.replace(/\n/g, '<br>')}
                </div>
              ` : ""}
              ${conduta ? `
                <div style="margin-top: 6px; padding: 6px 8px; background: #F8F9FA; border-left: 3px solid #1351b4; border-radius: 2px; font-size: 0.75rem; color: #333; line-height: 1.35;">
                  <strong>Conduta do Especialista:</strong><br>${conduta.replace(/\n/g, '<br>')}
                </div>
              ` : ""}
            </div>
          `;
        })
        .join("");
    } catch (e) {
      if (badge) {
        badge.style.background = "#FFEBEE";
        badge.style.color = "#c62828";
        badge.textContent = "Erro";
      }
      container.innerHTML = `<p style="margin: 0; font-size: 0.8rem; color: #c62828;">Falha ao consultar prontuário: ${e.message}</p>`;
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

  function renderChecklist(root) {
    const container = root.querySelector("#acesso-checklist-container");
    const badge = root.querySelector("#acesso-checklist-badge");
    const submitBtn = root.querySelector("#acesso-solicitar");
    if (!container) return;

    const emailInput = root.querySelector("#acesso-email-ubs");
    const emailUbs = emailInput ? emailInput.value.trim() : "";
    const especialidade = root.querySelector("#acesso-especialidade")?.value || "";

    const avaliacao = avaliarCompletude(currentPatient, emailUbs, especialidade);

    // Atualiza badge do topo
    if (badge) {
      if (avaliacao.prontoParaEnvio) {
        badge.style.background = "#E8F5E9";
        badge.style.color = "#2E7D32";
        badge.textContent = `Pronto (${avaliacao.sucessos}/${avaliacao.checks.length})`;
      } else {
        badge.style.background = "#FFF3CD";
        badge.style.color = "#856404";
        badge.textContent = `${avaliacao.criticosPendentes.length} pendência(s)`;
      }
    }

    // Renderiza cada item do checklist
    container.innerHTML = avaliacao.checks
      .map((item) => {
        const icon = item.ok ? "✅" : (item.critico ? "❌" : "⚠️");
        const corBorda = item.ok ? "#4CAF50" : (item.critico ? "#d32f2f" : "#FF9800");
        const corFundo = item.ok ? "#ffffff" : (item.critico ? "#FFF8F8" : "#FFFDF6");

        return `
          <div style="border-left: 3px solid ${corBorda}; background: ${corFundo}; padding: 8px 10px; margin-bottom: 6px; border-radius: 4px; font-size: 0.8rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 600; color: #333;">
              <span>${icon} ${item.titulo}</span>
              ${item.critico && !item.ok ? '<span style="color: #d32f2f; font-size: 0.7rem; text-transform: uppercase;">Obrigatório</span>' : ''}
            </div>
            <div style="color: #666; font-size: 0.75rem; margin-top: 3px; line-height: 1.3;">
              ${item.detalhe}
            </div>
          </div>
        `;
      })
      .join("");
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
    renderChecklist(root);
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
    renderChecklist(root);
    loadEspecialidades(root);
    loadProntuarioTelemedicina(root, currentPatient?.cpf);
  }

  /** Atualiza o paciente usado no payload (chamado a cada nova extração do Wasm). */
  function setPatient(patient) {
    const previousCpf = currentPatient?.cpf;
    currentPatient = patient || null;
    const sidebar = document.getElementById("esus-lens-sidebar");
    if (sidebar) {
      refreshPreview(sidebar);
      renderChecklist(sidebar);
      if (currentPatient?.cpf && currentPatient.cpf !== previousCpf) {
        loadProntuarioTelemedicina(sidebar, currentPatient.cpf);
      }
    }
  }

  return { NOT_FOUND, tabHtml, init, setPatient, buildTeleconsultoriaPayload, describeError, avaliarCompletude };
})();
