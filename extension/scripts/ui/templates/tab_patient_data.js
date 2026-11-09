/**
 * tab_patient_data.js
 * Renderiza o conteúdo da Aba 1 (Visão Geral da Gestante) com seções Geral, Social e Clínico.
 */

const PatientDataTemplate = (() => {
    function renderSectionGeral(data) {
        return `
            <div id="section-geral" class="esus-section-content" style="padding: 0; background-color: #FFFFFF; display: block;">
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
        `;
    }

    function renderSectionSocial(data) {
        const sd = data.sociodemografico || {};
        const end = data.endereco || {};

        return `
            <div id="section-social" class="esus-section-content" style="display: none; padding: 0;">
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
        `;
    }

    function renderSectionClinico(data) {
        const cs = data.condicoes_saude || {};

        return `
            <div id="section-clinico" class="esus-section-content" style="display: none; padding: 0;">
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
        `;
    }

    function render(data) {
        return `
            <div>
                <h3 style="margin: 0 8px 0 0; font-size: 0.95rem; font-weight: 600; color: #333; margin-bottom: 4px;">
                    Dados da Paciente
                </h3>
                <span style="font-size: 0.75rem; color: #888; display: block; margin-bottom: 16px;">Informações sincronizadas com o prontuário</span>
            </div>

            <!-- Button Group para Geral / Social / Clínico -->
            <div style="background-color: #E8E8E8; border-radius: 6px; padding: 4px; display: flex; gap: 4px; margin-bottom: 16px;">
                <button class="esus-btn-group active" data-section="geral" style="flex: 1; padding: 10px; border: none; background-color: #FFFFFF; color: #333; font-weight: 500; font-size: 0.85rem; cursor: pointer; border-radius: 4px; transition: all 0.2s;">Geral</button>
                <button class="esus-btn-group" data-section="social" style="flex: 1; padding: 10px; border: none; background-color: transparent; color: #666; font-weight: 500; font-size: 0.85rem; cursor: pointer; border-radius: 4px; transition: all 0.2s;">Social</button>
                <button class="esus-btn-group" data-section="clinico" style="flex: 1; padding: 10px; border: none; background-color: transparent; color: #666; font-weight: 500; font-size: 0.85rem; cursor: pointer; border-radius: 4px; transition: all 0.2s;">Clínico</button>
            </div>

            <!-- Seções -->
            ${renderSectionGeral(data)}
            ${renderSectionSocial(data)}
            ${renderSectionClinico(data)}
        `;
    }

    function initButtonGroupEvents(container) {
        const btnGroup = container.querySelectorAll('.esus-btn-group');
        const sectionContents = container.querySelectorAll('.esus-section-content');

        btnGroup.forEach(btn => {
            btn.addEventListener('click', (e) => {
                btnGroup.forEach(b => {
                    b.style.backgroundColor = 'transparent';
                    b.style.color = '#666';
                });
                sectionContents.forEach(s => s.style.display = 'none');

                e.target.style.backgroundColor = '#FFFFFF';
                e.target.style.color = '#333';
                e.target.style.fontWeight = '500';
                const sectionId = e.target.getAttribute('data-section');
                const targetSection = container.querySelector('#section-' + sectionId);
                if (targetSection) targetSection.style.display = 'block';
            });
        });
    }

    return {
        render,
        initButtonGroupEvents
    };
})();

