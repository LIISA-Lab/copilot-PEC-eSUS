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
// (página do PEC em HTTPS chamando API em HTTP). A API key também não é exposta à página.

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
});
