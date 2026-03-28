import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const CONFIG_DIR = join(homedir(), '.config', 'nextblog-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'data.json');

function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function readConfig() {
  ensureConfigDir();
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return {};
  }
}

export function writeConfig(config) {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getConfig(key) {
  return readConfig()[key];
}

export function setConfig(key, value) {
  const config = readConfig();
  config[key] = value;
  writeConfig(config);
}

export function requireServer() {
  const server = getConfig('server');
  if (!server) {
    console.error('No server configured. Run: nextblog config set-server <url>');
    process.exit(1);
  }
  return server.replace(/\/$/, '');
}

export function getToken() {
  return getConfig('token');
}
