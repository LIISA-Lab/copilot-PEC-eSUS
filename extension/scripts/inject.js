// inject.js
// Este script é injetado diretamente na página web do e-SUS para ter acesso ao window original
// e conseguir interceptar as requisições de rede feitas pelo fetch.

(function() {
  const originalFetch = window.fetch;

  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

    // Se for a requisição GraphQL
    if (url && url.includes('/graphql')) {
      const clonedResponse = response.clone();
      
      clonedResponse.json().then(data => {
        // O eSUS manda um array de queries [{operationName: "Sessao"}, {operationName: "Flags"}]
        if (Array.isArray(data)) {
          const sessaoQuery = data.find(item => item.data && item.data.sessao);
          if (sessaoQuery && sessaoQuery.data.sessao) {
            const sessao = sessaoQuery.data.sessao;
            
            // Monta o objeto estruturado e salva no window pro Wasm puxar depois
            window.__ESUS_GRAPHQL_DATA__ = {
              professional_name: sessao.profissional?.nome || null,
              professional_cpf: sessao.profissional?.cpf || null,
              cbo_name: sessao.acesso?.cbo?.nome || null,
              health_unit_name: sessao.acesso?.unidadeSaude?.nome || null
            };
            
            // Dispara um evento global avisando que os dados chegaram
            window.dispatchEvent(new CustomEvent('esus_graphql_intercepted', { 
                detail: window.__ESUS_GRAPHQL_DATA__ 
            }));
            
            console.log("[e-SUS Lens] Dados do Médico interceptados via GraphQL:", window.__ESUS_GRAPHQL_DATA__);
          }
        }
      }).catch(err => console.log("Erro ao interceptar fetch do esus:", err));
    }
    return response;
  };
})();
