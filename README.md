# e-SUS PEC Lens — Risk Stratifier (Wasm Extension)

Extensão de alta performance para Google Chrome desenvolvida em **Rust** compilado para **WebAssembly (Wasm)**. O objetivo principal é inspecionar, extrair e consolidar dados clínicos e demográficos do Prontuário Eletrônico do Cidadão (**e-SUS PEC**) em tempo de execução, permitindo a **estratificação de risco clínico populacional** na Atenção Primária à Saúde (APS) e pavimentando o caminho para interoperabilidade com a Atenção Secundária/Terciária.

---

## 🎯 Visão Geral do Projeto

Esta extensão opera diretamente no navegador do profissional de saúde, funcionando como um *Local-First EHR (Prontuário Eletrônico Local)*:

1. **Extração Híbrida (DOM + GraphQL):** O motor lê não apenas a interface visual do e-SUS, mas também intercepta silenciosamente requisições de rede (GraphQL), extraindo dados profundos do Cadastro Individual e da Folha de Rosto sem comprometer a navegação.
2. **Processamento em Rust (Wasm) + Clean Architecture:** O Wasm centraliza todo o parsing, mesclagem de dados (Merge) e regras de negócios, garantindo tipagem forte, ausência de vazamento de memória e processamento na velocidade nativa do SO.
3. **Persistência Local-First (IndexedDB):** Como os dados do e-SUS trafegam em páginas separadas, a extensão armazena e consolida um histórico cumulativo do paciente diretamente no banco NoSQL do navegador do médico.
4. **Painel de Bordo Interativo (DevTools-like):** Adiciona uma Sidebar responsiva injetada diretamente na interface do e-SUS PEC, utilizando o padrão visual do `gov.br`, para exibir o consolidado clínico.
5. **Privacidade por Design:** O processamento ocorre *in-memory* localmente, minimizando o tráfego externo de dados sensíveis e garantindo conformidade com a LGPD.

---

## 🏗️ Arquitetura do Sistema

O projeto adota os princípios da **Clean Architecture** (Arquitetura Limpa), dividida nas seguintes camadas:

*   **`domain`:** Modelos de dados aninhados (`Patient`, `CondicoesSaude`, `SocioDemografico`) e lógica de mesclagem (`merge`), isolados de frameworks externos.
*   **`services`:** Orquestração do caso de uso (Extração -> Banco de Dados Local -> Resposta), definindo as traits (Interfaces) que a infraestrutura deve seguir.
*   **`infrastructure`:** 
    *   `dom_parser.rs`: Extratores e sanitizadores baseados em seletores CSS e payloads JSON (GraphQL).
    *   `storage/`: Adaptadores assíncronos que conectam o Rust ao Chrome `IndexedDB` (`idb_helper.js`).
*   **`extension`:** A casca em JavaScript (Manifest V3) contendo o interceptador de requisições de rede (`inject.js`) e a renderização da interface visual (`content.js`).

---

## 🚀 Status do MVP (Fase 1 e 2)

O foco das versões iniciais foi a validação da ponte Wasm, intercepção de dados e interface UI:

- [x] Injetar o módulo Wasm via Content Script em instâncias web do e-SUS PEC (SPA / History API).
- [x] Extrair dados via manipulação da árvore DOM.
- [x] Implementar Interceptador de Rede (Proxy HTTP) para capturar respostas `GraphQL` invisíveis da API do PEC (Sessão, Período Gestacional e Cidadão Básico).
- [x] Consolidar dados de Morbidades, Sócio-Demográficos, Idade Gestacional (Cálculo de Semanas) e CIAP.
- [x] Injetar UI Sidebar lateral interativa (Estilo DevTools) ancorada à tela do PEC com Abas e Sanfonas.
- [x] Implementar cache **Offline-First** via IndexedDB para acumular histórico de dados entre abas do e-SUS.
- [ ] Construir o Motor de Inferência (Estratificador de Risco) baseado nos dados armazenados.
- [ ] Implementar cliente HTTP REST/GraphQL no Rust para envio em lote (Batch) e sincronização HIE (Health Information Exchange) com backend remoto.

---

## 🛠️ Como Compilar e Rodar Localmente

### Pré-requisitos
* [Rust e Cargo](https://rustup.rs/) instalados.
* [Node.js](https://nodejs.org/) e npm instalados.
* Compilador de WebAssembly instalado: `cargo install wasm-pack`

### Passos de Instalação

1. Clone o repositório.
2. Na raiz do projeto, instale os pacotes npm e compile o projeto para Wasm:
   ```bash
   npm install
   npm run build
   ```
3. Abra o Google Chrome e acesse `chrome://extensions/`.
4. Habilite o **Modo do Desenvolvedor** no canto superior direito.
5. Clique em **"Carregar sem compactação"** (Load unpacked) e selecione a pasta `extension/` gerada no projeto.
6. Acesse o ambiente do e-SUS PEC, clique no ícone da extensão no navegador e a Sidebar será acionada!
