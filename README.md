# e-SUS PEC Lens — Risk Stratifier (Wasm Extension)

Extensão de alta performance para Google Chrome desenvolvida em **Rust** compilado para **WebAssembly (Wasm)**. O objetivo principal é inspecionar e extrair dados da árvore de navegação do Prontuário Eletrônico do Cidadão (**e-SUS PEC**) em tempo de execução, permitindo a **estratificação de risco de gestantes** em territórios da Atenção Primária à Saúde (APS).

---

## 🎯 Visão Geral do Projeto

O acompanhamento do pré-natal exige identificação ágil de critérios de risco habitual, intermediário ou alto risco. Esta extensão opera diretamente no navegador do profissional de saúde:

1. **Leitura Não Invasiva:** Mapeia a árvore DOM da interface web do e-SUS PEC sem alterar os fluxos padrão do sistema.
2. **Processamento em Rust (Wasm):** Executa o parsing estruturado e a lógica de inferência de regras clínicas com overhead mínimo de memória e CPU.
3. **Privacidade por Design:** O processamento ocorre *in-memory* localmente no navegador, minimizando o tráfego externo de dados sensíveis de saúde (alinhado às diretrizes da LGPD).

---

## 🚀 Escopo do MVP (Fase 1)

O foco da versão mínima viável (PoC/MVP) é a validação da ponte entre a extensão e o DOM do e-SUS PEC:

- [ ] Injetar o módulo Wasm via Content Script em instâncias web do e-SUS PEC.
- [ ] Mapear seletores e extrair ao menos um nó de dados clínicos/demográficos essenciais do prontuário (ex.: DUM, idade gestacional, CPF ou histórico de consultas).
- [ ] Registrar os dados capturados de forma estruturada no console ou em um popup flutuante de debug.
