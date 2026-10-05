// Background Service Worker

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
