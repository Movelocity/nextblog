#!/bin/sh
set -eu

# 支持定义接收多个环境变量，以逗号分隔
# 例如: RUNTIME_ENV_VARS="API_URL,CDN_HOST"
# 默认值为"API_BASE_URL"
RUNTIME_ENV_VARS="${RUNTIME_ENV_VARS:-API_BASE_URL}"

RUNTIME_CONFIG_PATH="/app/public/runtime-env.js"

# 从备份恢复 public 目录（当使用 tmpfs 覆盖时需要这样做，以保持容器根目录的只读性）
if [ -d "/app/.public-backup" ]; then
  cp -r /app/.public-backup/* /app/public/ 2>/dev/null || true
fi

# 环境变量替换
IFS=','
for var_name in $RUNTIME_ENV_VARS; do
  # 获取环境变量值
  var_value=$(eval echo "\${${var_name}:-}")
  
  # 转义特殊字符
  escaped_value=$(echo "$var_value" | sed 's/[\/&]/\\&/g')

   # 执行替换，将 __PLACEHOLDER_{ENV_NAME}__ 替换为实际值
  sed -i "s|__PLACEHOLDER_${var_name}__|${escaped_value}|g" "${RUNTIME_CONFIG_PATH}"
  
  echo "  ✓ ${var_name} = ${var_value}"
done

# 用新进程替换当前进程，传递所有参数给新命令
exec "$@"

