# e-SUS PEC Lens — AI First Edition (Wasm Extension)

Extensão para Google Chrome escrita em **Rust** compilado para **WebAssembly (Wasm)**. Ela lê, em tempo de execução, os dados clínicos e demográficos do Prontuário Eletrônico do Cidadão (**e-SUS PEC**) e entrega ao profissional da Atenção Primária à Saúde (APS):

- **estratificação de risco gestacional**;
- **apoio à decisão com IA generativa (Gemini)**;
- **teleconsultoria integrada ao Acesso Saúde CE**;
- **escuta da consulta com geração automática do SOAP (Scriba)**;
- **sincronização com a API Central HIE de Linhas de Cuidado (SESA-CE)**.

---

## 🎯 Visão Geral

A extensão roda no navegador do profissional de saúde como um *Local-First EHR*:

1. **Extração híbrida (DOM + GraphQL):** intercepta as respostas GraphQL do PEC (sessão do profissional, cidadão, Cadastro Individual, período gestacional e evolução SOAP) e usa o DOM como fallback.
2. **Processamento em Rust (Wasm):** parsing, merge cumulativo de dados, regras de gestação e estratificação de risco rodam localmente, com tipagem forte e em milissegundos.
3. **Persistência local-first (IndexedDB):** consolida o histórico do paciente entre as telas do PEC e guarda a análise de IA (`ia_analise`) para reaproveitamento.
4. **Sidebar integrada ao PEC:** painel lateral no padrão visual `gov.br`, com abas e banner de orientação injetado na própria tela do prontuário.
5. **Privacidade por design:** nome, CPF, CNS, nome da mãe e endereço **nunca** são enviados à IA. Só vai o contexto clínico anônimo (idade, sexo, idade gestacional, comorbidades, SOAP).

---

## ✨ Funcionalidades

### 🧭 Navegação no PEC (SPA)
- Detecta a troca de paciente sem precisar de F5: History API (`pushState`/`replaceState`/`popstate`), mudança do nome no cabeçalho e **mudança do ID na URL** em:
  - `/gestaoCadastros/cadastro-individual/<id>/`
  - `/lista-atendimento/atendimento/<id>/`
- Limpa o cache do paciente anterior no momento da troca, para que dados de um paciente não se misturem com os de outro.
- Mantém o módulo Wasm em memória (singleton) e coloca as extrações em fila, para a interface atualizar rápido.

### 🤰 Estratificação de risco gestacional (Rust/Wasm)
- Identifica gestantes (CIAP/CID, condições autorreferidas, DUM/IG) e classifica em **Risco Habitual / Potencial / Alto Risco**, com os fatores identificados e a conduta recomendada (Manual de Gestação de Alto Risco do MS).
- Abas **Visão Geral**, **Sócio-Demográfico** e **Clínico** com os dados consolidados.

### 🧠 Briefing Clínico IA + Sinais de Alarme (Gemini)
- Uma única chamada ao Gemini gera:
  - o **Briefing Longitudinal** (perfil sintético, foco da consulta de hoje e conduta sugerida);
  - os **Red Flags** (picos pressóricos, sinais premonitórios de eclâmpsia, sangramento, febre com dor pélvica, redução de movimentos fetais etc.).
- Alarme **crítico** aparece em destaque vermelho no banner dentro do PEC.
- **A IA só é chamada quando o prontuário muda:** uma impressão digital do prontuário (*fingerprint*) fica salva no IndexedDB. Se nada mudou, o briefing salvo é reaproveitado na hora, sem nova chamada à IA.
- **Retroalimentação:** quando o prontuário muda, a análise anterior entra no prompt. A IA compara com a avaliação prévia (melhora, estabilidade ou piora) e guarda o histórico em `historico_evolucao` (Ciclo #1, #2...).
- **Isolamento entre pacientes:** uma resposta que chega depois da troca de paciente é salva no registro do paciente certo, mas **nunca** aparece na tela do paciente atual.

### 🏥 Acesso Saúde CE (Teleconsultoria)
- Monta automaticamente a solicitação de teleconsultoria (`POST /solicitacoes/teleconsultoria_pec`) com os dados do paciente, do profissional e da UBS.
- **Checklist de envio** com os campos obrigatórios. O item obstétrico aparece apenas para gestantes.
- **Histórico de Telemedicina** do paciente (`/agendamentos/prontuario/{cpf}`), com conduta, hipótese diagnóstica e anamnese do especialista.
- Banner no PEC com atalho **"Solicitar Parecer"** / **"Verificar Pendências"**.

### 🎙️ Scriba — Escuta da Consulta (Ambient Clinical Scribe)
- Escuta a consulta com a Web Speech API (pt-BR) e mostra a transcrição em tempo real. Se o Chrome desligar a escuta por silêncio, ela é religada automaticamente.
- **Gerar SOAP com IA:** o Gemini organiza a conversa em **Subjetivo, Objetivo, Avaliação e Plano**, traduz termos leigos para terminologia técnica e sugere o **CIAP-2**.
- O texto gerado pode ser revisado e editado antes do envio.
- **Preenchimento automático no PEC:**
  - SOAP: insere o texto nos editores Draft.js, por campo ou tudo de uma vez, acrescentando ou substituindo o conteúdo existente.
  - CIAP-2: preenche o autocomplete `ProblemasCondicoesForm.ciap`. O CID-10 é sugerido pelo próprio PEC.
- Ao trocar de paciente, a escuta é encerrada, o rascunho é apagado e respostas pendentes da IA são descartadas.

### 🔄 Sincronização HIE (API Central de Linhas de Cuidado)
- Sincronização silenciosa em lote (`POST /api/v1/sync/batch`) dos pacientes guardados no IndexedDB.
- Classifica cada paciente nas linhas de cuidado **Materno-Infantil**, **Diabetes**, **Hipertensão** ou **Atenção Primária**.
- Envia o atendimento atual com o SOAP e a análise de IA no campo `ia_analise` (coluna `JSONB` da tabela `atendimentos_hie`).

---

## 🗂️ Estrutura do Projeto

```text
copilot-PEC-eSUS/
├── src/                          # Núcleo em Rust (compilado para Wasm)
│   ├── domain/                   # Patient, regras de gestação, estratificação de risco
│   ├── infrastructure/           # Extrator DOM/GraphQL, repositório IndexedDB
│   └── services/                 # Caso de uso: extrair → mesclar → estratificar → salvar
├── extension/
│   ├── manifest.json
│   ├── pkg/                      # Saída do wasm-pack (gerada no build)
│   └── scripts/
│       ├── inject.js             # Interceptador GraphQL + History API (contexto da página)
│       ├── content.js            # Sidebar, banner no PEC, Briefing IA, sync HIE
│       ├── acesso_saude.js       # Aba Acesso Saúde CE (teleconsultoria)
│       ├── scriba.js             # Aba Scriba (voz → SOAP → PEC)
│       ├── idb_helper.js         # IndexedDB (preserva ia_analise entre gravações)
│       ├── background.js         # Service worker: Gemini, Acesso Saúde CE, API HIE
│       └── config.js             # Gerado a partir do .env (não versionar)
├── scripts/build_config.js       # Gera extension/scripts/config.js
└── implementations/              # Planos técnicos e roadmap
```

---

## 🛠️ Como Compilar e Rodar Localmente

### Pré-requisitos
* [Rust e Cargo](https://rustup.rs/)
* [Node.js](https://nodejs.org/) e npm
* `wasm-pack`: `cargo install wasm-pack`

### Configuração (`.env`)
Crie um arquivo `.env` na raiz do projeto:

```env
GEMINI_API_KEY=sua-chave-do-gemini
ACESSO_SAUDE_API_URL=https://url-da-api-acesso-saude
ACESSO_SAUDE_API_KEY=sua-chave-acesso-saude
HIE_SYNC_API_URL=https://url-da-api-hie
```

> [!CAUTION]
> O `extension/scripts/config.js` gerado contém as chaves. Não versione esse arquivo nem o `.env`.

### Build e instalação
1. Instale as dependências e compile:
   ```bash
   npm install
   npm run build      # gera config.js a partir do .env + compila o Wasm em extension/pkg
   ```
   Para atualizar apenas as chaves, sem recompilar o Rust: `npm run config`.
2. No Chrome, acesse `chrome://extensions/` e ative o **Modo do desenvolvedor**.
3. Clique em **"Carregar sem compactação"** e selecione a pasta `extension/`.
4. Abra o e-SUS PEC e clique no ícone da extensão para abrir a sidebar.
5. Na primeira vez que usar o **Scriba**, permita o acesso ao microfone para o site.

> Depois de alterar a extensão, recarregue-a em `chrome://extensions` e dê **F5** na aba do PEC.

---

## 🚀 Status

- [x] Módulo Wasm injetado via Content Script no PEC (SPA / History API)
- [x] Interceptação GraphQL + fallback DOM
- [x] Detecção de troca de paciente pela URL, pelo cabeçalho e por ID/CPF
- [x] Cache local-first no IndexedDB
- [x] Estratificação de risco gestacional (Rust)
- [x] Integração Acesso Saúde CE (teleconsultoria + histórico de telemedicina)
- [x] Sincronização em lote com a API HIE (incluindo `ia_analise`)
- [x] Briefing Clínico IA + Red Flags com cache por fingerprint e retroalimentação
- [x] Scriba: voz → SOAP → preenchimento no PEC + CIAP-2
- [ ] Redator de teleconsultoria no padrão SBAR (ver [`AI_FIRST_ROADMAP.md`](implementations/AI_FIRST_ROADMAP.md))
- [ ] Leitura de exames por imagem/PDF e alerta farmacológico de teratogenicidade

---

## 🔒 Privacidade e LGPD

- Identificadores pessoais (nome, CPF, CNS, nome da mãe, telefone, endereço) **não são enviados ao Gemini**.
- As chaves de API ficam no service worker (`background.js`) e não são expostas à página do PEC.
- O reconhecimento de voz nativo do Chrome (usado pelo Scriba) envia o áudio aos servidores da Google para transcrição. Para produção, avalie com a SESA-CE se isso é aceitável ou se a transcrição deve passar por um proxy institucional.

---

## 📚 Documentação Técnica

| Documento | Conteúdo |
| :--- | :--- |
| [`AI_FIRST_ROADMAP.md`](implementations/AI_FIRST_ROADMAP.md) | Visão e roadmap das funcionalidades com IA generativa |
| [`SCRIBA_IMPLEMENTATION_PLAN.md`](implementations/SCRIBA_IMPLEMENTATION_PLAN.md) | Arquitetura do Scriba e seletores do PEC |
| [`INTELLIGENCE_PLAN.md`](implementations/INTELLIGENCE_PLAN.md) | Estratificação neuro-simbólica e Red Flags |
| [`API_SYNC_GOVERNANCE_PLAN.md`](implementations/API_SYNC_GOVERNANCE_PLAN.md) | API HIE, linhas de cuidado e governança territorial |
| [`CDSS_TUTORING_PLAN.md`](implementations/CDSS_TUTORING_PLAN.md) | Suporte à decisão e tutoria de qualidade de dados |
| [`ARCHITECTURE_PLAN.md`](implementations/ARCHITECTURE_PLAN.md) | Arquitetura geral da extensão |
