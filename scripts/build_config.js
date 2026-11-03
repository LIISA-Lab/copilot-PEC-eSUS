#!/usr/bin/env node
/**
 * Gera `extension/scripts/config.js` a partir do `.env` da raiz do repositório.
 *
 * Extensões Chrome não conseguem ler arquivos `.env` em tempo de execução, então
 * as variáveis ACESSO_SAUDE_API_URL e ACESSO_SAUDE_API_KEY são "embutidas" em um
 * script carregado pelo service worker (background.js) via importScripts().
 *
 * O arquivo gerado está no .gitignore — NUNCA o versione (contém a API key).
 *
 * Uso:  node scripts/build_config.js   (também roda automaticamente no `npm run build`)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");
const OUT_PATH = path.join(ROOT, "extension", "scripts", "config.js");

function parseEnv(content) {
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue; // ignora linhas que não são "CHAVE=valor"
    let value = match[2].trim();
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    env[match[1]] = value;
  }
  return env;
}

const fileEnv = fs.existsSync(ENV_PATH) ? parseEnv(fs.readFileSync(ENV_PATH, "utf8")) : {};
// Variáveis do ambiente do shell têm prioridade sobre o .env (útil em CI)
const apiUrl = (process.env.ACESSO_SAUDE_API_URL || fileEnv.ACESSO_SAUDE_API_URL || "").replace(/\/+$/, "");
const apiKey = process.env.ACESSO_SAUDE_API_KEY || fileEnv.ACESSO_SAUDE_API_KEY || "";

const missing = [];
if (!apiUrl) missing.push("ACESSO_SAUDE_API_URL");
if (!apiKey) missing.push("ACESSO_SAUDE_API_KEY");
if (missing.length) {
  console.warn(`[build_config] ⚠ Variáveis ausentes no .env: ${missing.join(", ")}. A aba "Acesso Saúde CE" exibirá erro de configuração.`);
}

const output = `// ARQUIVO GERADO AUTOMATICAMENTE por scripts/build_config.js — NÃO EDITE E NÃO VERSIONE.
self.ACESSO_SAUDE_CONFIG = ${JSON.stringify({ apiUrl, apiKey }, null, 2)};
`;

fs.writeFileSync(OUT_PATH, output);
console.log(`[build_config] ✓ ${path.relative(ROOT, OUT_PATH)} gerado (API: ${apiUrl || "não definida"}).`);
