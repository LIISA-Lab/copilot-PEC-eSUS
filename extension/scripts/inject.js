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
        // Inicializa o state global se não existir
        if (!window.__ESUS_GRAPHQL_DATA__) {
            window.__ESUS_GRAPHQL_DATA__ = {};
        }

        let isUpdated = false;
        const payloadArray = Array.isArray(data) ? data : [data];

        payloadArray.forEach(item => {
            if (!item.data) return;

            // 1. Intercepta Dados da Sessão do Médico
            if (item.data.sessao) {
                const sessao = item.data.sessao;
                window.__ESUS_GRAPHQL_DATA__.session_info = {
                    professional_name: sessao.profissional?.nome || null,
                    professional_cpf: sessao.profissional?.cpf || null,
                    cbo_name: sessao.acesso?.cbo?.nome || null,
                    health_unit_name: sessao.acesso?.unidadeSaude?.nome || null
                };
                isUpdated = true;
            }

            // 2. Intercepta Dados do Paciente (Cidadão)
            const findCidadao = (obj) => {
                if (!obj || typeof obj !== 'object') return null;
                if (obj.cidadao && (obj.cidadao.cpf || obj.cidadao.cns || obj.cidadao.dataNascimento)) return obj.cidadao;
                for (const key of Object.keys(obj)) {
                    const found = findCidadao(obj[key]);
                    if (found) return found;
                }
                return null;
            };

            const cidadao = findCidadao(item.data);
            
            // 3. Intercepta Período Gestacional para extrair DUM e Idade Gestacional
            const findPeriodoGestacional = (obj) => {
                if (!obj || typeof obj !== 'object') return null;
                if (obj.periodoGestacional && obj.periodoGestacional.dataInicioGestacao) return obj.periodoGestacional;
                for (const key of Object.keys(obj)) {
                    const found = findPeriodoGestacional(obj[key]);
                    if (found) return found;
                }
                return null;
            };

            const periodoGestacional = findPeriodoGestacional(item.data);

            if (cidadao || periodoGestacional) {
                if (!window.__ESUS_GRAPHQL_DATA__.patient_info) {
                    window.__ESUS_GRAPHQL_DATA__.patient_info = {};
                }
                
                const p = window.__ESUS_GRAPHQL_DATA__.patient_info;
                
                if (cidadao) {
                    p.name = cidadao.nome || p.name || null;
                    p.cpf = cidadao.cpf || p.cpf || null;
                    p.cns = cidadao.cns || p.cns || null;
                    if (cidadao.dataNascimento) {
                        p.age = cidadao.dataNascimento.split('-').reverse().join('/');
                    }
                    p.sex = cidadao.sexo || p.sex || null;
                    p.gender_identity = cidadao.identidadeGeneroDbEnum || p.gender_identity || null;
                    p.mother_name = cidadao.nomeMae || p.mother_name || null;
                }

                if (periodoGestacional) {
                    // Pega DUM do dataInicioGestacao
                    if (periodoGestacional.dataInicioGestacao) {
                        p.ultima_dum = periodoGestacional.dataInicioGestacao.split('-').reverse().join('/');
                    }
                    // Pega a Idade Gestacional
                    if (periodoGestacional.idadeGestacionalCronologicaEmDias !== undefined) {
                        p.idade_gestacional_dias = periodoGestacional.idadeGestacionalCronologicaEmDias;
                    }
                }

                isUpdated = true;
            }
        });

        // Se houve atualização em qualquer entidade, dispara para o frontend Rust/Chrome
        if (isUpdated) {
            window.dispatchEvent(new CustomEvent('esus_graphql_intercepted', { 
                detail: window.__ESUS_GRAPHQL_DATA__ 
            }));
            console.log("[e-SUS Lens] Dados enriquecidos via GraphQL:", window.__ESUS_GRAPHQL_DATA__);
        }
      }).catch(err => console.log("Erro ao interceptar fetch do esus:", err));
    }
    return response;
  };
})();
