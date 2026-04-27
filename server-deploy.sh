#!/bin/sh

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

if command -v bash >/dev/null 2>&1; then
  exec bash "$SCRIPT_DIR/deploy/scripts/server-deploy.sh" "$@"
elif [ -x /bin/bash ]; then
  exec /bin/bash "$SCRIPT_DIR/deploy/scripts/server-deploy.sh" "$@"
else
  echo "[ERROR] 当前脚本需要 bash 执行，请先安装 bash。" >&2
  exit 1
fi
