#!/bin/sh
set -eu

# RUNTIME_ENV_VARS accepts comma-separated env names (or name:runtimeKey).
# Example: RUNTIME_ENV_VARS="API_BASE_URL:apiBaseUrl,NEXT_PUBLIC_IMG_CDN"
RUNTIME_ENV_VARS="${RUNTIME_ENV_VARS:-API_BASE_URL}"
RUNTIME_CONFIG_PATH="/app/public/runtime-env.js"

echo "Generating runtime config at ${RUNTIME_CONFIG_PATH} ..."

node - <<'NODE'
const fs = require('fs');
const path = process.env.RUNTIME_CONFIG_PATH || "/app/public/runtime-env.js";
const raw = process.env.RUNTIME_ENV_VARS || "API_BASE_URL";

const mappings = raw
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
  .map((item) => {
    const [envName, runtimeKeyRaw] = item.split(':');
    const envKey = (envName || '').trim();
    const runtimeKey = (runtimeKeyRaw || envKey).trim();
    return { envKey, runtimeKey };
  })
  .filter(({ envKey }) => envKey.length > 0);

if (mappings.length === 0) {
  console.error("ERROR: RUNTIME_ENV_VARS 为空，至少需要一个环境变量映射");
  process.exit(1);
}

const entries = [];

mappings.forEach(({ envKey, runtimeKey }) => {
  const value = process.env[envKey];
  if (!value) {
    console.error(`ERROR: 环境变量 ${envKey} 为空，请在容器启动时注入该值`);
    process.exit(1);
  }
  entries.push(`  ${JSON.stringify(runtimeKey)}: ${JSON.stringify(value)}`);
  console.log(` - ${envKey} -> window.__RUNTIME_CONFIG__.${runtimeKey}`);
});

const content = `window.__RUNTIME_CONFIG__ = {\n${entries.join(",\n")}\n};\n`;

try {
  fs.writeFileSync(path, content, 'utf-8');
} catch (err) {
  console.error(`ERROR: 无法写入 ${path}:`, err);
  process.exit(1);
}
NODE

exec "$@"

