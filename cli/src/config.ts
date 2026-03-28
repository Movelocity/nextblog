import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export interface Config {
  server?: string;
  token?: string;
  [key: string]: string | undefined;
}

const CONFIG_DIR = join(homedir(), '.config', 'nextblog-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'data.json');

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function readConfig(): Config {
  ensureConfigDir();
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf8')) as Config;
  } catch {
    return {};
  }
}

export function writeConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getConfig(key: string): string | undefined {
  return readConfig()[key];
}

export function setConfig(key: string, value: string): void {
  const config = readConfig();
  config[key] = value;
  writeConfig(config);
}

export function requireServer(): string {
  const server = getConfig('server');
  if (!server) {
    console.error('No server configured. Run: nblog config set-server <url>');
    process.exit(1);
  }
  return (server as string).replace(/\/$/, '');
}

export function getToken(): string | undefined {
  return getConfig('token');
}
