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
            
            // 4. Intercepta Dados Extras (Raça/Cor, Telefone, Social, Saúde)
            // Esses dados vêm na query CidadaoVisualizacao, aninhados no objeto cidadao.
            if (cidadao) {
                if (!window.__ESUS_GRAPHQL_DATA__.patient_info) {
                    window.__ESUS_GRAPHQL_DATA__.patient_info = {};
                }
                const p = window.__ESUS_GRAPHQL_DATA__.patient_info;
                
                // UUID interno do Cidadão no e-SUS
                p.id = cidadao.id || p.id || null;
                
                // Telefone e Etnia/Raça
                p.telefone_celular = cidadao.telefoneCelular || p.telefone_celular || null;
                p.raca_cor = cidadao.racaCor?.nome || p.raca_cor || null;

                // Informações Sócio-Demográficas
                if (cidadao.informacoesSociodemograficas || cidadao.escolaridade || cidadao.cbo) {
                    const infoSocio = cidadao.informacoesSociodemograficas || {};
                    p.sociodemografico = {
                        escolaridade: cidadao.escolaridade?.nome || null,
                        ocupacao: cidadao.cbo?.nome || null,
                        situacao_mercado_trabalho: infoSocio.situacaoMercadoTrabalho || null,
                        possui_plano_saude_privado: infoSocio.possuiPlanoSaudePrivado !== undefined ? infoSocio.possuiPlanoSaudePrivado : null,
                        possui_deficiencia: infoSocio.possuiDeficiencia !== undefined ? infoSocio.possuiDeficiencia : null,
                    };
                }

                // Condições de Saúde Autorreferidas (Morbidades Mapeadas)
                if (cidadao.condicoesSaudeAutorreferidas) {
                    const cond = cidadao.condicoesSaudeAutorreferidas;
                    // Para os booleanos, usamos !== null ? cond.valor : null para preservar o false!
                    p.condicoes_saude = {
                        gestante: cond.stGestante !== null ? cond.stGestante : null,
                        maternidade_referencia: cond.maternidadeReferencia || null,
                        peso_adequado: cond.autodenominacaoPeso || null,
                        acamado: cond.stAcamado !== null ? cond.stAcamado : null,
                        domiciliar: cond.stDomiciliar !== null ? cond.stDomiciliar : null,
                        fumante: cond.stFumante !== null ? cond.stFumante : null,
                        uso_alcool: cond.stUsoAlcool !== null ? cond.stUsoAlcool : null,
                        uso_drogas: cond.stUsoOutrasDrogas !== null ? cond.stUsoOutrasDrogas : null,
                        saude_mental: cond.stProblemaSaudeMental !== null ? cond.stProblemaSaudeMental : null,
                        hipertensao_arterial: cond.stHipertensaoArterial !== null ? cond.stHipertensaoArterial : null,
                        diabetes: cond.stDiabetes !== null ? cond.stDiabetes : null,
                        cancer: cond.stCancer !== null ? cond.stCancer : null,
                        derrame: cond.stDerrame !== null ? cond.stDerrame : null,
                        infarto: cond.stInfarto !== null ? cond.stInfarto : null,
                        hanseniase: cond.stHanseniase !== null ? cond.stHanseniase : null,
                        tuberculose: cond.stTuberculose !== null ? cond.stTuberculose : null,
                        doenca_cardiaca: cond.stDoencaCardiaca !== null ? cond.stDoencaCardiaca : null,
                        detalhes_doenca_cardiaca: cond.doencaCardiaca && cond.doencaCardiaca.length > 0 ? cond.doencaCardiaca : null,
                        problema_rins: cond.stProblemaRins !== null ? cond.stProblemaRins : null,
                        detalhes_doenca_rins: cond.doencaRins && cond.doencaRins.length > 0 ? cond.doencaRins : null,
                        doenca_respiratoria: cond.stDoencaRespiratoria !== null ? cond.stDoencaRespiratoria : null,
                        detalhes_doenca_respiratoria: cond.doencasRespiratorias && cond.doencasRespiratorias.length > 0 ? cond.doencasRespiratorias : null,
                        internacao_12_meses: cond.stInternacaoUltimos12Meses !== null ? cond.stInternacaoUltimos12Meses : null,
                        causa_internacao: cond.causaInternacaoUltimos12Meses || null,
                        plantas_medicinais: cond.stPlantasMedicinais !== null ? cond.stPlantasMedicinais : null
                    };
                }

                isUpdated = true;
            }
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
