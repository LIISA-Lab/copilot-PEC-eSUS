function showSidebar(data) {
  const existingSidebar = document.getElementById("esus-lens-sidebar");
  if (existingSidebar) {
      // Se já existe e os dados mudaram (ou foram atualizados), removemos a anterior para recriar com o novo paciente
      existingSidebar.remove();
  }

  if (!data) {
      return;
  }

  const isPregnant = data.is_pregnant === true;

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
    const end = data.endereco || {};

    sidebar.innerHTML = `
    <style>
        .esus-tab { flex: 1; padding: 12px 0; border: none; background: none; cursor: pointer; font-weight: 500; font-size: 0.8rem; color: #666; border-bottom: 3px solid transparent; transition: all 0.2s; }
        .esus-tab:hover { background-color: #f1f1f1; }
        .esus-tab.active { color: #1351b4; border-bottom: 3px solid #1351b4; background-color: #F8F9FA;}
        .esus-tab-content { display: none; background-color: #FFFFFF; height: calc(100vh - 110px); overflow-y: auto;}
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
        <div style="display: flex; flex-direction: column; width: 100%">
            <h2 style="margin: 0; font-size: 1.1rem; font-weight: 500; display: flex; align-items: center; gap: 8px">
                e-SUS Lens Gestante
            </h2>
            <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; margin-top: 2px">
                <span style="font-size: 1rem; color: #b3cde0; margin-top: 2px;">Estratificação de Risco</span>
                <span style="font-size: 0.7rem; color: #b3cde0; margin-top: 4px; margin-right: 8px; font-family: monospace;">v${chrome.runtime.getManifest().version}</span>
            </div>
        </div>
        <button id="esus-lens-close" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; padding: 4px;" title="Minimizar">✖</button>
    </div>

    <!-- Navegação em Abas -->
    <div style="display: flex; background: #fff; border-bottom: 1px solid #ccc;">
        ${isPregnant ? `
          <button class="esus-tab active" data-tab="tab-geral">Visão Geral</button>
          <button class="esus-tab" data-tab="tab-socio">Sócio-Dem.</button>
          <button class="esus-tab" data-tab="tab-saude">Clínico</button>
          <button class="esus-tab" data-tab="tab-acesso-saude">Acesso Saúde CE</button>
        ` : `
          <button class="esus-tab active" data-tab="tab-acesso-saude" style="color: #1351b4; border-bottom: 3px solid #1351b4; background-color: #F8F9FA;">Acesso Saúde CE (Teleconsultoria)</button>
        `}
    </div>

    <!-- ABA 1: VISÃO GERAL -->
    <div id="tab-geral" class="esus-tab-content ${isPregnant ? 'active' : ''}">
        <!-- Alerta de Identificação -->
        <div style="background-color: #E8F5E9; padding: 6px 16px; border-radius: 4px; margin-bottom: 16px; display: flex; align-items: center; max-width: 220px;">
            <h3 style="margin: 0; color: #000000ff; font-size: 0.75rem; font-weight: 600;"> <span style="width: 12px; height: 12px; background-color: #4CAF50; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>Gestante em Monitoramento</h3>
        </div>

        <!-- Cartão de Paciente -->
        <div style="background-color: #FFFFFF; border: 1px solid #E0E0E0; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
            <div style="margin-bottom: 8px; display: flex; flex-direction: row; align-items: center;">
                <h3 style="margin: 0 8px 0 0; font-size: 0.95rem; font-weight: 600; color: #333;">
                    ${data.name || 'Paciente sem identificação'}
                </h3>
                <p style="margin: 0; font-size: 0.75rem; font-weight: 200; color: #666;">
                    <strong>${data.age || 'Idade não informada'}</strong>
                </p>
            </div>
            <div style="background-color: #FFF3CD; border: 1px solid #FFC107; padding: 8px 12px; border-radius: 3px;">
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                    <p style="margin: 0; font-size: 1rem; background-color: #FFC107; padding: 0.5rem; border-radius: 4px; color: #FFD230; font-weight: 600; margin-right: 8px;">
                        ⚠️ 
                    </p>
                    <div style="margin-bottom: 4px; display: flex; flex-direction: column;">
                        <strong style="font-size: 10px; font-weight: 600;">CLASSIFICAÇÃO DE RISCO</strong> 
                        <strong style="font-size: 14px; font-weight: 700;">Risco Intermediário</strong>
                    </div>
                </div>
                <span style="font-size: 14px; font-weight: 200; color: #973C00;">Verifique os dados clínicos e sócio-demográficos antes de qualquer conduta.</span>
            </div>
        </div>

    </div>

    <!-- ABA 1: VISÃO GERAL -->
    <div id="tab-geral" class="esus-tab-content active">

        <!-- Button Group para Geral / Social / Clínico -->
        <div style="background-color: #E8E8E8; border-radius: 6px; padding: 4px; display: flex; gap: 4px; margin: 16px 16px 16px 16px;">
            <button class="esus-btn-group active" data-section="geral" style="flex: 1; padding: 10px; border: none; background-color: #FFFFFF; color: #333; font-weight: 500; font-size: 0.85rem; cursor: pointer; border-radius: 4px; transition: all 0.2s;">Geral</button>
            <button class="esus-btn-group" data-section="social" style="flex: 1; padding: 10px; border: none; background-color: transparent; color: #666; font-weight: 500; font-size: 0.85rem; cursor: pointer; border-radius: 4px; transition: all 0.2s;">Social</button>
            <button class="esus-btn-group" data-section="clinico" style="flex: 1; padding: 10px; border: none; background-color: transparent; color: #666; font-weight: 500; font-size: 0.85rem; cursor: pointer; border-radius: 4px; transition: all 0.2s;">Clínico</button>
        </div>

        <!-- Conteúdo dinâmico baseado no button group - FORMATO GRADE -->
        <div id="section-geral" class="esus-section-content" style="padding: 0 16px; background-color: #FFFFFF; display: block;">
            <!-- Grid de dados -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-bottom: 16px;">
                <!-- Linha 1 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Nome Completo</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${data.name || 'Não inf.'}</span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Idade / Nasc.</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${data.age || 'Não inf.'}</span>
                </div>

                <!-- Linha 2 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">CPF</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${data.cpf || 'Não inf.'}</span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">CNS</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${data.cns || 'Não inf.'}</span>
                </div>

                <!-- Linha 3 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Sexo / Gênero</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">
                        ${data.sex ? data.sex.charAt(0).toUpperCase() + data.sex.slice(1).toLowerCase() : 'Não inf.'}
                        ${data.gender_identity ? `<br><small style="color:#777;">(${data.gender_identity.replace('_', ' ')})</small>` : ''}
                    </span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Última DUM</span>
                    <span style="font-weight: 600; color: #D84315; font-size: 0.9rem;">${data.ultima_dum || 'Sem Registro'}</span>
                </div>

                <!-- Linha 4 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Idade Gestacional</span>
                    <span style="font-weight: 600; color: #1565C0; font-size: 0.9rem;">
                        ${data.idade_gestacional_dias ? Math.floor(data.idade_gestacional_dias / 7) + ' sem ' + (data.idade_gestacional_dias % 7) + ' d' : 'Sem Registro'}
                    </span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">CIPA Atual</span>
                    <span style="font-weight: 600; color: #1565C0; font-size: 0.9rem;">${data.cod_cipa || '-'}</span>
                </div>

                <!-- Linha 5 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Profissional Logado</span>
                    <span style="font-weight: 600; color: #1351b4; font-size: 0.9rem;">
                        ${data.session_info ? data.session_info.professional_name : 'Intercepção Pendente...'}
                    </span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">CBO</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${data.session_info?.cbo_name || 'Não inf.'}</span>
                </div>

                <!-- Linha 6 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Unidade (UBS)</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${data.session_info?.health_unit_name || 'Não inf.'}</span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">CNES</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${data.session_info?.health_unit_cnes || 'Não inf.'}</span>
                </div>

                <!-- Linha 7 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Município</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${data.session_info?.municipio_nome || 'Não inf.'}</span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Conselho de Classe</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">
                        ${data.session_info?.conselho_classe_sigla || data.session_info?.numero_conselho_classe
                            ? [
                                data.session_info?.conselho_classe_sigla,
                                data.session_info?.numero_conselho_classe,
                              ].filter(Boolean).join(' ') +
                              (data.session_info?.uf_conselho_classe_sigla ? `/${data.session_info.uf_conselho_classe_sigla}` : '')
                            : 'Não inf.'}
                    </span>
                </div>
            </div>
        </div>

        <div id="section-social" class="esus-section-content" style="display: none; padding: 0 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-bottom: 16px;">
                <!-- Linha 1 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Telefone Celular</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${data.telefone_celular || 'Não inf.'}</span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Raça / Cor</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${data.raca_cor || 'Não inf.'}</span>
                </div>

                <!-- Linha 2 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF; grid-column: 1 / -1;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Nome da Mãe</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${data.mother_name || 'Não inf.'}</span>
                </div>

                <!-- Linha 3 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF; grid-column: 1 / -1;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Logradouro</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">
                        ${[end.tipo_logradouro?.nome, end.logradouro].filter(Boolean).join(' ') || end.logradouro || 'Não inf.'}
                        ${end.numero ? `, nº ${end.numero}` : (end.sem_numero ? ', S/N' : '')}
                    </span>
                </div>

                <!-- Linha 4 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Bairro</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${end.bairro || 'Não inf.'}</span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">CEP</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${end.cep || 'Não inf.'}</span>
                </div>

                <!-- Linha 5 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Município / UF</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">
                        ${[end.municipio?.nome, end.uf?.nome].filter(Boolean).join(' / ') || 'Não inf.'}
                    </span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Complemento</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${end.complemento || 'Não inf.'}</span>
                </div>

                <!-- Linha 6 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF; grid-column: 1 / -1;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Ponto de Referência</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${end.ponto_referencia || 'Não inf.'}</span>
                </div>

                <!-- Linha 7 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Escolaridade</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${sd.escolaridade || 'Não inf.'}</span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Ocupação (CBO)</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${sd.ocupacao || 'Não inf.'}</span>
                </div>

                <!-- Linha 8 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Situação no Mercado</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">
                        ${sd.situacao_mercado_trabalho ? sd.situacao_mercado_trabalho.replace(/_/g, ' ') : 'Não inf.'}
                    </span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Plano de Saúde Privado</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${sd.possui_plano_saude_privado ? 'Sim' : 'Não'}</span>
                </div>

                <!-- Linha 9 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Possui Deficiência</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${sd.possui_deficiencia ? 'Sim' : 'Não'}</span>
                </div>
            </div>
        </div>

        <div id="section-clinico" class="esus-section-content" style="display: none; padding: 0 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-bottom: 16px;">
                <!-- Linha 1 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Hipertensão Arterial</span>
                    <span style="font-weight: 600; color: ${cs.hipertensao_arterial ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.hipertensao_arterial ? 'Sim' : 'Não'}</span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Diabetes</span>
                    <span style="font-weight: 600; color: ${cs.diabetes ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.diabetes ? 'Sim' : 'Não'}</span>
                </div>

                <!-- Linha 2 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Doença Cardíaca</span>
                    <span style="font-weight: 600; color: ${cs.doenca_cardiaca ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.doenca_cardiaca ? 'Sim' : 'Não'}</span>
                    ${cs.detalhes_doenca_cardiaca ? `<div style="font-size:0.75rem; color:#d32f2f; margin-top:4px;">${cs.detalhes_doenca_cardiaca.join(', ').replace(/_/g, ' ')}</div>` : ''}
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Problemas nos Rins</span>
                    <span style="font-weight: 600; color: ${cs.problema_rins ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.problema_rins ? 'Sim' : 'Não'}</span>
                    ${cs.detalhes_doenca_rins ? `<div style="font-size:0.75rem; color:#d32f2f; margin-top:4px;">${cs.detalhes_doenca_rins.join(', ').replace(/_/g, ' ')}</div>` : ''}
                </div>

                <!-- Linha 3 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Asma / DPOC</span>
                    <span style="font-weight: 600; color: ${cs.doenca_respiratoria ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.doenca_respiratoria ? 'Sim' : 'Não'}</span>
                    ${cs.detalhes_doenca_respiratoria ? `<div style="font-size:0.75rem; color:#d32f2f; margin-top:4px;">${cs.detalhes_doenca_respiratoria.join(', ').replace(/_/g, ' ')}</div>` : ''}
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Câncer</span>
                    <span style="font-weight: 600; color: ${cs.cancer ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.cancer ? 'Sim' : 'Não'}</span>
                </div>

                <!-- Linha 4 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Derrame / AVC</span>
                    <span style="font-weight: 600; color: ${cs.derrame ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.derrame ? 'Sim' : 'Não'}</span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Infarto</span>
                    <span style="font-weight: 600; color: ${cs.infarto ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.infarto ? 'Sim' : 'Não'}</span>
                </div>

                <!-- Linha 5 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Hanseníase</span>
                    <span style="font-weight: 600; color: ${cs.hanseniase ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.hanseniase ? 'Sim' : 'Não'}</span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Tuberculose</span>
                    <span style="font-weight: 600; color: ${cs.tuberculose ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.tuberculose ? 'Sim' : 'Não'}</span>
                </div>

                <!-- Linha 6 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Acamado</span>
                    <span style="font-weight: 600; color: ${cs.acamado ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.acamado ? 'Sim' : 'Não'}</span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Atendimento Domiciliar</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${cs.domiciliar ? 'Sim' : 'Não'}</span>
                </div>

                <!-- Linha 7 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Problema de Saúde Mental</span>
                    <span style="font-weight: 600; color: ${cs.saude_mental ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.saude_mental ? 'Sim' : 'Não'}</span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Internação 12 Meses</span>
                    <span style="font-weight: 600; color: ${cs.internacao_12_meses ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.internacao_12_meses ? 'Sim' : 'Não'}</span>
                    ${cs.causa_internacao ? `<div style="font-size:0.75rem; color:#d32f2f; margin-top:4px;">Motivo: ${cs.causa_internacao}</div>` : ''}
                </div>

                <!-- Linha 8 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Fumante</span>
                    <span style="font-weight: 600; color: ${cs.fumante ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.fumante ? 'Sim' : 'Não'}</span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Uso de Álcool</span>
                    <span style="font-weight: 600; color: ${cs.uso_alcool ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.uso_alcool ? 'Sim' : 'Não'}</span>
                </div>

                <!-- Linha 9 -->
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Uso de Outras Drogas</span>
                    <span style="font-weight: 600; color: ${cs.uso_drogas ? '#c62828' : '#333'}; font-size: 0.9rem;">${cs.uso_drogas ? 'Sim' : 'Não'}</span>
                </div>
                <div style="border: 1px solid #E0E0E0; border-radius: 4px; padding: 12px; background-color: #FFFFFF;">
                    <span style="font-size: 0.75rem; text-transform: uppercase; color: #888; display: block; margin-bottom: 4px;">Uso de Plantas Med.</span>
                    <span style="font-weight: 600; color: #333; font-size: 0.9rem;">${cs.plantas_medicinais ? 'Sim' : 'Não'}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- ABA 2: SÓCIO-DEMOGRÁFICO -->
    <div id="tab-socio" class="esus-tab-content">
        <!-- Conteúdo da aba Sócio-Demográfico -->
    </div>

    <!-- ABA 3: CLÍNICO -->
    <div id="tab-saude" class="esus-tab-content">
        <!-- Conteúdo da aba Clínico -->
    </div>

    <!-- ABA 4: ACESSO SAÚDE CE (Teleconsultoria) -->
    <div id="tab-acesso-saude" class="esus-tab-content ${isPregnant ? '' : 'active'}">
        ${AcessoSaude.tabHtml()}
    </div>
  `;

    document.body.appendChild(sidebar);

    // Aba Acesso Saúde CE: paciente atual + carregamento das especialidades
    AcessoSaude.setPatient(data);
    AcessoSaude.init(sidebar);

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

    // Lógica do Button Group (Geral / Social / Clínico) dentro da aba Visão Geral
    const btnGroup = sidebar.querySelectorAll('.esus-btn-group');
    const sectionContents = sidebar.querySelectorAll('.esus-section-content');

    btnGroup.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active de todos
            btnGroup.forEach(b => {
                b.style.backgroundColor = 'transparent';
                b.style.color = '#666';
            });
            sectionContents.forEach(s => s.style.display = 'none');

            // Adiciona active no clicado
            e.target.style.backgroundColor = '#FFFFFF';
            e.target.style.color = '#333';
            e.target.style.fontWeight = '500';
            const sectionId = e.target.getAttribute('data-section');
            sidebar.querySelector('#section-' + sectionId).style.display = 'block';
        });
    });

    // Lógica para empurrar o conteúdo do e-SUS para o lado
    // Lógica para empurrar o conteúdo do e-SUS para o lado
    document.body.style.transition = "padding-right 0.3s ease-in-out";
    document.body.style.paddingRight = "400px";

    // Marca como aberta no sistema de controle
    isSidebarOpen = true;

    // Botão fechar (Minimizar)
    document.getElementById("esus-lens-close").addEventListener("click", () => {
        sidebar.style.transform = "translateX(400px)";
        document.body.style.paddingRight = "0";
        isSidebarOpen = false; // Libera para abrir sozinho de novo se navegar pra outra gestante

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
        isSidebarOpen = true; // Atualiza a flag
    });

    document.body.appendChild(btn);
}

// ─── FRENTE 2: EMBED DE TUTELAMENTO NA UI DO PEC (DOM INJECTION) ────────────

/**
 * Abre a sidebar posicionando diretamente na aba "Acesso Saúde CE"
 */
function openSidebarToAcessoSaude() {
const sidebar = document.getElementById("esus-lens-sidebar");
if (!sidebar) {
    runWasmExtractor(false);
    return;
}
sidebar.style.transform = "translateX(0)";
document.body.style.paddingRight = "400px";
isSidebarOpen = true;

const btnAcesso = sidebar.querySelector('button[data-tab="tab-acesso-saude"]');
if (btnAcesso) btnAcesso.click();

const reopen = document.getElementById("esus-lens-reopen");
if (reopen) reopen.style.display = "none";
}

/**
 * Injeta avisos contextuais e badges de tutelamento diretamente na página do e-SUS PEC
 */
function embedPecGuidance(patient) {
if (!patient || !AcessoSaude?.avaliarCompletude) return;

// Remove embeds anteriores para reavaliar sem duplicar
const oldBanner = document.getElementById("esus-lens-pec-banner");
if (oldBanner) oldBanner.remove();

const avaliacao = AcessoSaude.avaliarCompletude(patient, "", "");
const headerAlvo = document.querySelector("h2.css-k7p917");
if (!headerAlvo || !headerAlvo.parentElement) return;

const banner = document.createElement("div");
banner.id = "esus-lens-pec-banner";
banner.style.margin = "10px 0 14px 0";
banner.style.padding = "10px 14px";
banner.style.borderRadius = "6px";
banner.style.fontFamily = "'Roboto', 'Segoe UI', Arial, sans-serif";
banner.style.fontSize = "0.85rem";
banner.style.display = "flex";
banner.style.alignItems = "center";
banner.style.justifyContent = "space-between";
banner.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";
banner.style.transition = "all 0.2s ease-in-out";

if (avaliacao.prontoParaEnvio) {
    banner.style.backgroundColor = "#E8F5E9";
    banner.style.borderLeft = "4px solid #4CAF50";
    banner.style.color = "#1B5E20";

    banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 1.1rem;">🩺</span>
        <span>
        <strong>e-SUS Lens:</strong> Dados clínicos aptos para solicitar teleconsultoria no <strong>Acesso Saúde CE</strong>.
        </span>
    </div>
    <button id="esus-lens-btn-abrir-acesso" style="background-color: #2E7D32; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; font-weight: 600; cursor: pointer; font-size: 0.8rem; white-space: nowrap;">
        Solicitar Parecer ➔
    </button>
    `;
} else {
    banner.style.backgroundColor = "#FFF3CD";
    banner.style.borderLeft = "4px solid #FFA000";
    banner.style.color = "#856404";

    const pendenciasTexto = avaliacao.criticosPendentes.map((c) => c.titulo).join(", ");

    banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 1.1rem;">💡</span>
        <div>
        <strong>e-SUS Lens (Acesso Saúde CE):</strong> Faltam dados essenciais para teleconsultoria:
        <span style="color: #d32f2f; font-weight: 500;"> ${pendenciasTexto}</span>.
        </div>
    </div>
    <button id="esus-lens-btn-abrir-acesso" style="background-color: #1351b4; color: #fff; border: none; padding: 6px 12px; border-radius: 4px; font-weight: 600; cursor: pointer; font-size: 0.8rem; white-space: nowrap; margin-left: 12px;">
        Verificar Pendências ➔
    </button>
    `;
}

// Insere o banner diretamente na interface do PEC, logo abaixo do nome do paciente
headerAlvo.parentElement.insertAdjacentElement("afterend", banner);

// Evento de clique para abrir a sidebar diretamente na aba correta
banner.querySelector("#esus-lens-btn-abrir-acesso")?.addEventListener("click", (e) => {
    e.preventDefault();
    openSidebarToAcessoSaude();
});
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

async function runWasmExtractor(isSilent = false) {
  try {
    // 1. Espera a UI do paciente carregar
    await waitForPatientNameElement();
    
    if (!isSilent) console.log("[e-SUS Lens] UI detectada. Carregando módulo Wasm...");

    // 2. Importa e inicializa o WebAssembly compilado
    const wasmUrl = chrome.runtime.getURL("pkg/copilot_pec_esus.js");
    const wasm = await import(wasmUrl);
    await wasm.default(chrome.runtime.getURL("pkg/copilot_pec_esus_bg.wasm"));

    // 3. Chama a função em Rust que lê o DOM, Mescla com Banco Local e devolve o Objeto
    try {
        const patientData = await wasm.extract_patient_info_promise();
        
        // Se patientData for NULL, não há dados para processar
        if (!patientData) {
            return;
        }
        
        console.log("[e-SUS Lens] Dados extraídos e consolidados pelo Rust:", patientData);

        // Mantém a aba Acesso Saúde CE com o paciente mais recente (mesmo com a sidebar já aberta)
        AcessoSaude.setPatient(patientData);

        // FRENTE 2: Embedar avisos de tutelamento diretamente na UI nativa do e-SUS PEC
        embedPecGuidance(patientData);

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

// Flag de controle para evitar aberturas simultâneas/repetitivas enquanto o médico navega
let isSidebarOpen = false;

// Ouve o evento emitido pelo inject.js caso ele consiga pegar os dados
window.addEventListener('esus_graphql_intercepted', (e) => {
    console.log("[e-SUS Lens Content] Recebido sinal do interceptor:", e.detail);
    localStorage.setItem('__ESUS_GRAPHQL_DATA__', JSON.stringify(e.detail));

    // Executa a extração e atualiza os dados na tela (mesmo que a sidebar já esteja aberta)
    runWasmExtractor(true);
});

// Listener para abrir a sidebar MANUALMENTE quando o ícone da extensão é clicado
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TOGGLE_SIDEBAR") {
    const sidebar = document.getElementById("esus-lens-sidebar");
    
    // Se a sidebar já existe, controlamos a visibilidade (abre/fecha)
    if (sidebar) {
      if (sidebar.style.transform === "translateX(400px)") {
        sidebar.style.transform = "translateX(0)";
        document.body.style.paddingRight = "400px";
        isSidebarOpen = true;
      } else {
        sidebar.style.transform = "translateX(400px)";
        document.body.style.paddingRight = "0";
        isSidebarOpen = false;
      }
    } else {
      // Execução ativa/forçada (não silenciosa)
      runWasmExtractor(false);
    }
  }
});
