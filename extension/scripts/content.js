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
        .esus-tab-content { display: none; padding: 16px; background-color: #F8F9FA; height: calc(100vh - 110px); overflow-y: auto;}
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
        <div style="display: flex; flex-direction: column;">
            <h2 style="margin: 0; font-size: 1.1rem; font-weight: 500; display: flex; align-items: center; gap: 8px;">
                <span>🩺</span> e-SUS Lens: Estratificação
            </h2>
            <span style="font-size: 0.7rem; color: #b3cde0; margin-top: 4px; font-family: monospace;">v${chrome.runtime.getManifest().version}</span>
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
        <div style="background-color: #E8F5E9; border-left: 4px solid #4CAF50; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px;">
            <h3 style="margin: 0 0 4px 0; color: #2E7D32; font-size: 1rem;">🤰 Paciente em Monitoramento</h3>
            <p style="margin: 0; font-size: 0.85rem; color: #1B5E20;">Dados interceptados do e-SUS</p>
        </div>

        <details class="esus-accordion" open>
            <summary>Identificação Rápida</summary>
            <div class="acc-content">
                <div style="margin-bottom: 12px;">
                    <strong class="data-label">Nome Completo</strong>
                    ${formatVal(data.name)}
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Idade / Nasc.</strong>
                        ${formatVal(data.age)}
                    </div>
                    <div>
                        <strong class="data-label">Sexo / Gênero</strong>
                        <span>
                            ${data.sex ? data.sex.charAt(0).toUpperCase() + data.sex.slice(1).toLowerCase() : 'Não inf.'}
                            ${data.gender_identity ? `<br><small style="color:#777;">(${data.gender_identity.replace('_', ' ')})</small>` : ''}
                        </span>
                    </div>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">CPF</strong>
                        ${formatVal(data.cpf)}
                    </div>
                    <div>
                        <strong class="data-label">CNS</strong>
                        ${formatVal(data.cns)}
                    </div>
                </div>
            </div>
        </details>

        <details class="esus-accordion" open>
            <summary>Módulo Obstétrico</summary>
            <div class="acc-content">
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Última DUM</strong>
                        <span style="font-weight: 500; color: #D84315;">${data.ultima_dum || 'Sem Registro'}</span>
                    </div>
                    <div>
                        <strong class="data-label">Idade Gestacional</strong>
                        <span style="font-weight: 500; color: #1565C0;">
                            ${data.idade_gestacional_dias ? Math.floor(data.idade_gestacional_dias / 7) + ' sem ' + (data.idade_gestacional_dias % 7) + ' d' : 'Sem Registro'}
                        </span>
                    </div>
                </div>
                <div style="margin-bottom: 12px;">
                    <strong class="data-label">CIPA Atual</strong>
                    <span style="background-color: #E3F2FD; color: #1565C0; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; display: inline-block; margin-top: 4px;">
                        ${data.cod_cipa || '-'}
                    </span>
                </div>
                <div>
                    <strong class="data-label">Status de Risco Clínico (Ministério da Saúde)</strong>
                    ${(() => {
                        const est = data.estratificacao_risco;
                        if (!est) return '<span style="color: #9E9E9E; font-style: italic; font-size: 0.85rem;">Estratificação não aplicável (paciente geral).</span>';
                        
                        return `
                          <div style="margin-top: 6px; padding: 10px; border-radius: 6px; border-left: 4px solid ${est.cor}; background-color: #FAFAFA; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                              <span style="font-weight: 700; color: ${est.cor}; font-size: 0.85rem;">${est.rotulo}</span>
                            </div>
                            ${est.fatores && est.fatores.length > 0 ? `
                              <div style="margin: 6px 0; font-size: 0.75rem; color: #444;">
                                <strong>Fatores Identificados:</strong>
                                <ul style="margin: 4px 0 0 0; padding-left: 16px;">
                                  ${est.fatores.map(f => `<li style="margin-bottom: 2px;"><strong>${f.categoria}:</strong> ${f.descricao}</li>`).join('')}
                                </ul>
                              </div>
                            ` : '<p style="margin: 4px 0; font-size: 0.75rem; color: #2E7D32;">Ausência de fatores de risco clínico ou sociodemográfico registrados.</p>'}
                            <div style="margin-top: 6px; font-size: 0.72rem; color: #666; line-height: 1.35; border-top: 1px dashed #DDD; padding-top: 5px;">
                              <strong>Conduta Recomendada:</strong> ${est.conduta_recomendada}
                            </div>
                          </div>
                        `;
                    })()}
                </div>
            </div>
        </details>

        <details class="esus-accordion">
            <summary>Profissional Logado</summary>
            <div class="acc-content">
                <div style="margin-bottom: 12px;">
                    <strong class="data-label">Médico / Profissional</strong>
                    <span style="font-weight: 500; color: #1351b4;">
                        ${data.session_info ? data.session_info.professional_name : 'Intercepção Pendente...'}
                    </span>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">CBO</strong>
                        ${formatVal(data.session_info?.cbo_name)}
                    </div>
                    <div>
                        <strong class="data-label">Unidade (UBS)</strong>
                        <span style="font-size: 0.8rem;">${data.session_info?.health_unit_name || 'Não inf.'}</span>
                    </div>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">CNES</strong>
                        ${formatVal(data.session_info?.health_unit_cnes)}
                    </div>
                    <div>
                        <strong class="data-label">Município</strong>
                        ${formatVal(data.session_info?.municipio_nome)}
                    </div>
                </div>
                <div>
                    <strong class="data-label">Conselho de Classe</strong>
                    ${formatVal(
                        data.session_info?.conselho_classe_sigla || data.session_info?.numero_conselho_classe
                            ? [
                                data.session_info?.conselho_classe_sigla,
                                data.session_info?.numero_conselho_classe,
                              ].filter(Boolean).join(' ') +
                              (data.session_info?.uf_conselho_classe_sigla ? `/${data.session_info.uf_conselho_classe_sigla}` : '')
                            : null
                    )}
                </div>
            </div>
        </details>
    </div>

    <!-- ABA 2: SÓCIO-DEMOGRÁFICO -->
    <div id="tab-socio" class="esus-tab-content">
        <details class="esus-accordion" open>
            <summary>Contato e Raça/Cor</summary>
            <div class="acc-content">
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Telefone Celular</strong>
                        ${formatVal(data.telefone_celular)}
                    </div>
                    <div>
                        <strong class="data-label">Raça / Cor</strong>
                        ${formatVal(data.raca_cor)}
                    </div>
                </div>
                <div>
                    <strong class="data-label">Nome da Mãe</strong>
                    ${formatVal(data.mother_name)}
                </div>
            </div>
        </details>

        <details class="esus-accordion" open>
            <summary>Endereço Residencial</summary>
            <div class="acc-content">
                <div style="margin-bottom: 12px;">
                    <strong class="data-label">Logradouro</strong>
                    ${formatVal([end.tipo_logradouro?.nome, end.logradouro].filter(Boolean).join(' ') || end.logradouro)}
                    ${end.numero ? `, nº ${end.numero}` : (end.sem_numero ? ', S/N' : '')}
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Bairro</strong>
                        ${formatVal(end.bairro)}
                    </div>
                    <div>
                        <strong class="data-label">CEP</strong>
                        ${formatVal(end.cep)}
                    </div>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Município / UF</strong>
                        ${formatVal([end.municipio?.nome, end.uf?.nome].filter(Boolean).join(' / '))}
                    </div>
                    <div>
                        <strong class="data-label">Complemento</strong>
                        ${formatVal(end.complemento)}
                    </div>
                </div>
                <div>
                    <strong class="data-label">Ponto de Referência</strong>
                    ${formatVal(end.ponto_referencia)}
                </div>
            </div>
        </details>

        <details class="esus-accordion" open>
            <summary>Educação e Trabalho</summary>
            <div class="acc-content">
                <div style="margin-bottom: 12px;">
                    <strong class="data-label">Escolaridade</strong>
                    ${formatVal(sd.escolaridade)}
                </div>
                <div style="margin-bottom: 12px;">
                    <strong class="data-label">Ocupação (CBO)</strong>
                    ${formatVal(sd.ocupacao)}
                </div>
                <div>
                    <strong class="data-label">Situação no Mercado</strong>
                    ${formatVal(sd.situacao_mercado_trabalho ? sd.situacao_mercado_trabalho.replace(/_/g, ' ') : null)}
                </div>
            </div>
        </details>

        <details class="esus-accordion" open>
            <summary>Informações Sociais</summary>
            <div class="acc-content">
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Plano de Saúde Privado?</strong>
                        ${formatBool(sd.possui_plano_saude_privado)}
                    </div>
                    <div>
                        <strong class="data-label">Possui Deficiência?</strong>
                        ${formatBool(sd.possui_deficiencia)}
                    </div>
                </div>
            </div>
        </details>
    </div>

    <!-- ABA 3: CONDIÇÕES DE SAÚDE (CLÍNICO) -->
    <div id="tab-saude" class="esus-tab-content">
        <div style="background-color: #FFF3E0; border-left: 4px solid #FF9800; padding: 12px 16px; border-radius: 4px; margin-bottom: 16px;">
            <p style="margin: 0; font-size: 0.85rem; color: #E65100;">Estes dados são auto-referidos pela paciente durante o Cadastro Individual.</p>
        </div>

        <details class="esus-accordion" open>
            <summary>Doenças Crônicas</summary>
            <div class="acc-content">
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Hipertensão Arterial</strong>
                        ${formatBool(cs.hipertensao_arterial, true)}
                    </div>
                    <div>
                        <strong class="data-label">Diabetes</strong>
                        ${formatBool(cs.diabetes, true)}
                    </div>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Doença Cardíaca</strong>
                        ${formatBool(cs.doenca_cardiaca, true)}
                        ${cs.detalhes_doenca_cardiaca ? `<div style="font-size:0.75rem; color:#d32f2f; margin-top:2px;">${cs.detalhes_doenca_cardiaca.join(', ').replace(/_/g, ' ')}</div>` : ''}
                    </div>
                    <div>
                        <strong class="data-label">Problemas nos Rins</strong>
                        ${formatBool(cs.problema_rins, true)}
                        ${cs.detalhes_doenca_rins ? `<div style="font-size:0.75rem; color:#d32f2f; margin-top:2px;">${cs.detalhes_doenca_rins.join(', ').replace(/_/g, ' ')}</div>` : ''}
                    </div>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Asma / DPOC</strong>
                        ${formatBool(cs.doenca_respiratoria, true)}
                        ${cs.detalhes_doenca_respiratoria ? `<div style="font-size:0.75rem; color:#d32f2f; margin-top:2px;">${cs.detalhes_doenca_respiratoria.join(', ').replace(/_/g, ' ')}</div>` : ''}
                    </div>
                    <div>
                        <strong class="data-label">Câncer</strong>
                        ${formatBool(cs.cancer, true)}
                    </div>
                </div>
            </div>
        </details>
        
        <details class="esus-accordion" open>
            <summary>Eventos Cardiovasculares e Infecciosos</summary>
            <div class="acc-content">
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Derrame / AVC</strong>
                        ${formatBool(cs.derrame, true)}
                    </div>
                    <div>
                        <strong class="data-label">Infarto</strong>
                        ${formatBool(cs.infarto, true)}
                    </div>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Hanseníase</strong>
                        ${formatBool(cs.hanseniase, true)}
                    </div>
                    <div>
                        <strong class="data-label">Tuberculose</strong>
                        ${formatBool(cs.tuberculose, true)}
                    </div>
                </div>
            </div>
        </details>

        <details class="esus-accordion" open>
            <summary>Condições Especiais</summary>
            <div class="acc-content">
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Acamado</strong>
                        ${formatBool(cs.acamado, true)}
                    </div>
                    <div>
                        <strong class="data-label">Atendimento Domiciliar</strong>
                        ${formatBool(cs.domiciliar, false)}
                    </div>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Problema de Saúde Mental</strong>
                        ${formatBool(cs.saude_mental, true)}
                    </div>
                    <div>
                        <strong class="data-label">Internação 12 Meses</strong>
                        ${formatBool(cs.internacao_12_meses, true)}
                        ${cs.causa_internacao ? `<div style="font-size:0.75rem; color:#d32f2f; margin-top:2px;">Motivo: ${cs.causa_internacao}</div>` : ''}
                    </div>
                </div>
            </div>
        </details>

        <details class="esus-accordion" open>
            <summary>Hábitos</summary>
            <div class="acc-content">
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Fumante</strong>
                        ${formatBool(cs.fumante, true)}
                    </div>
                    <div>
                        <strong class="data-label">Uso de Álcool</strong>
                        ${formatBool(cs.uso_alcool, true)}
                    </div>
                </div>
                <div class="grid-2">
                    <div>
                        <strong class="data-label">Uso de Outras Drogas</strong>
                        ${formatBool(cs.uso_drogas, true)}
                    </div>
                    <div>
                        <strong class="data-label">Uso de Plantas Med.</strong>
                        ${formatBool(cs.plantas_medicinais, false)}
                    </div>
                </div>
            </div>
        </details>
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

    // ─── Dispara Leitor de Sinais de Alarme com IA Gemini (Assíncrono) ──────
    checkGeminiRedFlagsAsync(patient, banner);
  }

  /**
   * Envia apenas os dados clínicos semânticos para o Gemini avaliar sinais de perigo iminente.
   * Não bloqueia a tela; se encontrar perigo crítico, atualiza o banner visual imediatamente.
   */
  async function checkGeminiRedFlagsAsync(patient, bannerEl) {
    if (!patient) return;
    const ev = patient.evolucao_pre_natal;
    // Se não há texto no SOAP, não há o que o NLP analisar
    if (!ev || (!ev.subjetivo && !ev.objetivo && !ev.avaliacao)) return;

    try {
      const soapPayload = {
        idade: patient.age || null,
        idadeGestacional: patient.idade_gestacional_dias ? `${Math.floor(patient.idade_gestacional_dias / 7)} semanas` : null,
        subjetivo: ev.subjetivo || null,
        objetivo: ev.objetivo || null,
        avaliacao: ev.avaliacao || null,
        problema: ev.problema || patient.cod_cipa || null,
      };

      chrome.runtime.sendMessage({ type: "GEMINI_ANALISAR_RED_FLAGS", payload: soapPayload }, (response) => {
        if (!response?.ok || !response.data) return;
        const result = response.data;

        if (result.temAlarme && result.gravidade === "CRITICO") {
          console.warn("[e-SUS Lens IA] SINAL DE ALARME CRÍTICO DETECTADO PELO GEMINI:", result);

          // Cria card de Alerta de Urgência no banner do PEC
          const alertaBox = document.createElement("div");
          alertaBox.id = "esus-lens-ia-alert";
          alertaBox.style.marginTop = "8px";
          alertaBox.style.padding = "8px 12px";
          alertaBox.style.backgroundColor = "#B71C1C";
          alertaBox.style.color = "#FFFFFF";
          alertaBox.style.borderRadius = "4px";
          alertaBox.style.fontWeight = "500";
          alertaBox.style.fontSize = "0.8rem";
          alertaBox.style.boxShadow = "0 2px 4px rgba(0,0,0,0.15)";

          const listaAlertas = result.alertas && result.alertas.length > 0
            ? result.alertas.map(a => `<li><strong>${a.titulo}:</strong> ${a.descricao} <em>(${a.condutaSugerida})</em></li>`).join("")
            : `<li>${result.resumoClinico || "Sinais premonitórios de urgência obstétrica identificados no texto da consulta."}</li>`;

          alertaBox.innerHTML = `
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="font-size: 1rem;">🚨</span>
              <strong style="text-transform: uppercase;">Atenção Clínica Crítica (IA Gemini):</strong>
            </div>
            <ul style="margin: 0; padding-left: 20px;">
              ${listaAlertas}
            </ul>
          `;

          // Remove alerta anterior se existir e insere no banner
          document.getElementById("esus-lens-ia-alert")?.remove();
          bannerEl.appendChild(alertaBox);
        }
      });
    } catch (e) {
      console.warn("[e-SUS Lens IA] Falha silenciosa ao checar sinais de alarme:", e);
    }
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

// Monitoramento Contínuo da Troca de Paciente no SPA do e-SUS PEC (Sem precisar de F5)
let lastObservedPatientName = "";

function setupSpaNavigationObserver() {
    // 1. Observer no elemento h2 onde fica o nome do paciente no cabeçalho do PEC
    const domObserver = new MutationObserver(() => {
        const nameEl = document.querySelector("h2.css-k7p917");
        const currentName = nameEl ? nameEl.textContent.trim() : "";

        if (currentName && currentName !== lastObservedPatientName) {
            console.log(`[e-SUS Lens SPA] Nome do paciente mudou de "${lastObservedPatientName}" para "${currentName}". Atualizando extensão...`);
            lastObservedPatientName = currentName;
            
            // Reexecuta o Wasm para capturar os dados do novo paciente diretamente do DOM/GraphQL
            runWasmExtractor(true);
        }
    });

    domObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // 2. Ouve eventos de troca de rota no SPA disparados pelo inject.js (pushState/popstate)
    window.addEventListener('esus_route_changed', (e) => {
        console.log("[e-SUS Lens SPA] Rota do e-SUS mudou:", e.detail?.url);
        // Aguarda meio segundo para a UI do novo prontuário renderizar
        setTimeout(() => {
            const nameEl = document.querySelector("h2.css-k7p917");
            const currentName = nameEl ? nameEl.textContent.trim() : "";
            if (currentName && currentName !== lastObservedPatientName) {
                lastObservedPatientName = currentName;
                runWasmExtractor(true);
            }
        }, 600);
    });
}

// Inicializa o monitoramento automático de SPA
setupSpaNavigationObserver();

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
