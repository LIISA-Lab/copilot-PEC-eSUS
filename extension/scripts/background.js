// Background Service Worker

// Configuração do Acesso Saúde CE (gerada a partir do .env por scripts/build_config.js)
try {
  importScripts("config.js");
} catch (err) {
  console.warn("[Background] config.js não encontrado. Rode `npm run config` para gerá-lo a partir do .env.", err);
}

// Escuta o clique no ícone da extensão na barra do Chrome
chrome.action.onClicked.addListener((tab) => {
  // Verifica se o usuário está na página do e-SUS antes de tentar injetar/abrir o painel
  if (tab.url && tab.url.includes("esustreinamento.saude.ce.gov.br")) {
    console.log("[Background] Ícone clicado. Disparando sinal para abrir a Sidebar.");

    // Envia uma mensagem para o content.js que está rodando na página ativa
    chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" }).catch(err => {
      console.warn("[Background] Erro ao enviar mensagem para a tab:", err);
    });
  }
});

// Listener antigo das notificações (Mantido)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "NOTIFY_PATIENT_DATA") {
    console.log("[Background] Mensagem recebida:", message.payload);
    const p = message.payload;

    // Formata o texto para a notificação
    const detalhes = `
Nome: ${p.name || 'Não inf.'}
Idade: ${p.age || 'Não inf.'}
Sexo: ${p.sex || 'Não inf.'}
CPF: ${p.cpf || 'Não inf.'}
Mãe: ${p.mother_name || 'Não inf.'}
CIPA: ${p.cod_cipa || 'Não inf.'}
    `.trim();

    // Como o foco é a Gestante, vamos mostrar o alerta com base nisso
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon.png", // Usar caminho relativo na Manifest V3 é mais seguro
      title: "e-SUS Lens: Gestante Identificada!",
      message: detalhes
    }, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error("[Background] Erro ao criar notificação:", chrome.runtime.lastError);
      } else {
        console.log("[Background] Notificação disparada com ID:", notificationId);
      }
    });
  }
});

// ─── Integração Acesso Saúde CE ────────────────────────────────────────────────
// As requisições são feitas aqui (e não no content script) porque o service worker
// possui host_permissions (sem bloqueio de CORS) e não sofre bloqueio de "mixed content"
// ─── Gemini 1.5 Flash (Leitor de Sinais de Alarme & Red Flags) ───────────────

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

function getGeminiApiKey() {
  const cfg = self.GEMINI_CONFIG || {};
  return cfg.apiKey || "";
}

/**
 * Analisa o relato clínico (SOAP + Condições de Saúde + Estratificação) para gerar:
 * 1) Sinais de perigo iminente (Red Flags)
 * 2) Briefing Longitudinal (Patient Digest 360º)
 * Dados identificadores (nome, CPF, endereço) NUNCA são passados para a IA.
 */
async function analisarRedFlagsComGemini(soapContext) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.warn("[e-SUS Lens Gemini] Chave GEMINI_API_KEY não configurada no .env.");
    return { ok: false, error: "Chave GEMINI_API_KEY ausente." };
  }

  const prompt = `
Você é um auditor clínico e especialista em Atenção Primária à Saúde e Obstetrícia (Ministério da Saúde do Brasil / SESA-CE).
Sua função é ler os dados clínicos anônimos do paciente e as anotações do atendimento (SOAP) para produzir:
1. Detecção de sinais de ALARME / URGÊNCIA CLÍNICA OU OBSTÉTRICA IMINENTE (Red Flags).
2. Um Briefing Longitudinal Executivo (Patient Digest) de leitura rápida (10 segundos) para orientar o profissional de saúde.

Lista de Sinais de Alarme Críticos a verificar:
1. Picos pressóricos graves (Pressão Arterial PAS >= 140 mmHg ou PAD >= 90 mmHg).
2. Sinais premonitórios de eclâmpsia ou emergência hipertensiva (cefaleia intensa/refratária, escotomas/visão turva, epigastralgia ou dor em barra no hipocôndrio direito, hiperreflexia, dor torácica, dispneia).
3. Sangramento vaginal em qualquer trimestre ou perda súbita de líquido amniótico.
4. Febre alta associada a dor pélvica, sintomas urinários graves ou sinais de sepse.
5. Ausência ou diminuição acentuada de movimentos fetais após 24 semanas.
6. Altura uterina muito discrepante, desaceleração/ausência de BCF ou descompensação glicêmica aguda.

Dados Clínicos Anônimos da Consulta:
Idade / Nascimento: ${soapContext.idade || "Não informada"}
Sexo: ${soapContext.sexo || "Não informado"}
Gestante: ${soapContext.isPregnant ? "Sim" : "Não / Não confirmado"}
Idade Gestacional: ${soapContext.idadeGestacional || "Não aplicável / Não informada"}
Estratificação de Risco Local: ${soapContext.rotuloRisco || "Não calculada"} (${soapContext.fatoresRisco || "Sem fatores listados"})
Condições de Saúde (Cadastro Individual): ${soapContext.condicoesSaude || "Nenhuma informada"}
Subjetivo: ${soapContext.subjetivo || "Vazio"}
Objetivo: ${soapContext.objetivo || "Vazio"}
Avaliação: ${soapContext.avaliacao || "Vazio"}
Problemas/Diagnósticos (CIAP/CID): ${soapContext.problema || "Nenhum"}

Responda OBRIGATORIAMENTE em formato JSON com o seguinte schema:
{
  "temAlarme": boolean,
  "gravidade": "CRITICO" | "MODERADO" | "NORMAL",
  "briefingLongitudinal": {
    "perfilSintetico": string,
    "focoConsultaHoje": string,
    "condutaSugerida": string
  },
  "alertas": [
    {
      "titulo": string,
      "descricao": string,
      "condutaSugerida": string
    }
  ],
  "resumoClinico": string
}
NÃO inclua markdown (como \`\`\`json) fora do objeto JSON. Devolva apenas o JSON puro.
  `.trim();

  try {
    const resp = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Google Gemini API HTTP ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) throw new Error("Resposta vazia da API do Gemini.");

    const parsedJson = JSON.parse(candidateText);
    return { ok: true, data: parsedJson };
  } catch (err) {
    console.error("[e-SUS Lens Gemini] Erro na inferência:", err);
    return { ok: false, error: err.message };
  }
}

const ACESSO_TIMEOUT_MS = 30000;

function getAcessoConfig() {
  const cfg = self.ACESSO_SAUDE_CONFIG || {};
  if (!cfg.apiUrl || !cfg.apiKey) {
    throw new Error("Configuração ausente: defina ACESSO_SAUDE_API_URL e ACESSO_SAUDE_API_KEY no .env e rode `npm run config`.");
  }
  return { apiUrl: cfg.apiUrl.replace(/\/+$/, ""), apiKey: cfg.apiKey };
}

async function acessoFetch(path, options = {}) {
  const { apiUrl, apiKey } = getAcessoConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ACESSO_TIMEOUT_MS);
  try {
    const resp = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: { "X-API-Key": apiKey, Accept: "application/json", ...(options.headers || {}) },
      signal: controller.signal,
    });
    const text = await resp.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return { ok: resp.ok, status: resp.status, body };
  } catch (err) {
    const reason = err.name === "AbortError" ? `tempo limite de ${ACESSO_TIMEOUT_MS / 1000}s excedido` : err.message;
    throw new Error(`Não foi possível conectar à API do Acesso Saúde CE (${apiUrl}): ${reason}`);
  } finally {
    clearTimeout(timer);
  }
}

async function getEspecialidades() {
  const result = await acessoFetch("/especialidades/?limit=1000");
  if (!result.ok) {
    const detail = typeof result.body === "object" && result.body?.detail ? result.body.detail : result.body;
    throw new Error(`HTTP ${result.status}${detail ? ` — ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : ""}`);
  }
  if (!Array.isArray(result.body)) throw new Error("Resposta inesperada do endpoint /especialidades/");
  return result.body
    .filter((e) => e && e.especialidade && e.ativo !== false)
    .map((e) => e.especialidade);
}

async function solicitarTeleconsultoria(payload) {
  // multipart/form-data, igual ao simular_teleconsultoria_pec.py
  const form = new FormData();
  for (const [campo, valor] of Object.entries(payload || {})) {
    if (valor === null || valor === undefined) continue; // campos opcionais omitidos
    form.append(campo, String(valor));
  }
  return acessoFetch("/solicitacoes/teleconsultoria_pec", { method: "POST", body: form });
}

// ─── HIE Linhas de Cuidado (Sync Batch com API Central) ─────────────────────

function getHieSyncUrl() {
  const cfg = self.HIE_SYNC_CONFIG || {};
  return (cfg.apiUrl || "https://api-hie.ngrok.app").replace(/\/+$/, "");
}

async function sincronizarLoteHie(batchPayload) {
  const baseUrl = getHieSyncUrl();
  const targetUrl = `${baseUrl}/api/v1/sync/batch`;
  console.log(`[e-SUS Lens HIE] Disparando sincronização em lote para: ${targetUrl}`, batchPayload);

  try {
    const resp = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(batchPayload),
    });

    const body = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      throw new Error(`API HIE HTTP ${resp.status}: ${JSON.stringify(body)}`);
    }

    console.log("[e-SUS Lens HIE] Resposta da sincronização recebida com sucesso:", body);
    return { ok: true, body };
  } catch (err) {
    console.error("[e-SUS Lens HIE] Falha ao sincronizar com a API HIE:", err);
    return { ok: false, error: err.message };
  }
}

async function getProntuario(cpf) {
  if (!cpf) throw new Error("CPF não informado para consulta de prontuário.");
  // Limpa caracteres não numéricos para garantir formato limpo
  const cleanCpf = encodeURIComponent(String(cpf).replace(/\D/g, "") || String(cpf).trim());
  return acessoFetch(`/agendamentos/prontuario/${cleanCpf}`);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ACESSO_GET_ESPECIALIDADES") {
    getEspecialidades()
      .then((especialidades) => sendResponse({ ok: true, especialidades }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true; // resposta assíncrona
  }

  if (message.type === "ACESSO_SOLICITAR_TELECONSULTORIA") {
    solicitarTeleconsultoria(message.payload)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, status: 0, error: err.message }));
    return true; // resposta assíncrona
  }

  if (message.type === "ACESSO_GET_PRONTUARIO") {
    getProntuario(message.cpf)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, status: 0, error: err.message }));
    return true; // resposta assíncrona
  }

  if (message.type === "GEMINI_ANALISAR_RED_FLAGS") {
    analisarRedFlagsComGemini(message.payload)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true; // resposta assíncrona
  }

  if (message.type === "HIE_SYNC_BATCH") {
    sincronizarLoteHie(message.payload)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true; // resposta assíncrona
  }
});
