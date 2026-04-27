#!/bin/sh

set -eu

MODE="${1:-}"
NODE_MODULES_DIR="${2:-}"
RUNTIME_DEPS_DIR="${3:-}"

if [ -z "$MODE" ] || [ -z "$NODE_MODULES_DIR" ] || [ -z "$RUNTIME_DEPS_DIR" ]; then
  echo "usage: $0 <export|inject> <node_modules_dir> <runtime_deps_dir>" >&2
  exit 1
fi

require_dir() {
  if [ ! -d "$1" ]; then
    echo "required directory not found: $1" >&2
    exit 1
  fi
}

first_match() {
  base_dir="$1"
  pattern="$2"
  find "$base_dir" -type d -path "$pattern" | head -n1
}

copy_dir_contents() {
  src_dir="$1"
  dest_dir="$2"
  rm -rf "$dest_dir"
  mkdir -p "$(dirname "$dest_dir")"
  cp -RL "$src_dir" "$dest_dir"
}

export_runtime_deps() {
  require_dir "$NODE_MODULES_DIR"
  require_dir "$NODE_MODULES_DIR/.pnpm"

  prisma_dir="$(first_match "$NODE_MODULES_DIR/.pnpm" '*/node_modules/.prisma')"
  prisma_client_dir="$(first_match "$NODE_MODULES_DIR/.pnpm" '*/node_modules/@prisma/client')"
  sharp_dir="$(first_match "$NODE_MODULES_DIR/.pnpm" '*/sharp@*/node_modules/sharp')"
  sharp_img_dir="$(first_match "$NODE_MODULES_DIR/.pnpm" '*/sharp@*/node_modules/@img')"

  if [ -z "$prisma_dir" ] || [ -z "$prisma_client_dir" ] || [ -z "$sharp_dir" ] || [ -z "$sharp_img_dir" ]; then
    echo "failed to resolve runtime dependency directories" >&2
    exit 1
  fi

  mkdir -p "$RUNTIME_DEPS_DIR/prisma-client/@prisma" "$RUNTIME_DEPS_DIR/sharp"

  copy_dir_contents "$prisma_dir" "$RUNTIME_DEPS_DIR/prisma-client/.prisma"
  copy_dir_contents "$prisma_client_dir" "$RUNTIME_DEPS_DIR/prisma-client/@prisma/client"
  copy_dir_contents "$sharp_dir" "$RUNTIME_DEPS_DIR/sharp/sharp"
  copy_dir_contents "$sharp_img_dir" "$RUNTIME_DEPS_DIR/sharp/@img"
}

inject_runtime_deps() {
  require_dir "$NODE_MODULES_DIR"
  require_dir "$NODE_MODULES_DIR/.pnpm"
  require_dir "$RUNTIME_DEPS_DIR/prisma-client/.prisma"
  require_dir "$RUNTIME_DEPS_DIR/prisma-client/@prisma/client"
  require_dir "$RUNTIME_DEPS_DIR/sharp/sharp"
  require_dir "$RUNTIME_DEPS_DIR/sharp/@img"

  prisma_target="$(first_match "$NODE_MODULES_DIR/.pnpm" '*/node_modules/.prisma')"
  prisma_client_target="$(first_match "$NODE_MODULES_DIR/.pnpm" '*/node_modules/@prisma/client')"
  sharp_target="$(first_match "$NODE_MODULES_DIR/.pnpm" '*/sharp@*/node_modules/sharp')"
  sharp_img_target="$(first_match "$NODE_MODULES_DIR/.pnpm" '*/sharp@*/node_modules/@img')"

  if [ -z "$prisma_target" ] || [ -z "$prisma_client_target" ] || [ -z "$sharp_target" ] || [ -z "$sharp_img_target" ]; then
    echo "failed to resolve standalone runtime target directories" >&2
    exit 1
  fi

  copy_dir_contents "$RUNTIME_DEPS_DIR/prisma-client/.prisma" "$prisma_target"
  copy_dir_contents "$RUNTIME_DEPS_DIR/prisma-client/@prisma/client" "$prisma_client_target"
  copy_dir_contents "$RUNTIME_DEPS_DIR/sharp/sharp" "$sharp_target"
  copy_dir_contents "$RUNTIME_DEPS_DIR/sharp/@img" "$sharp_img_target"
}

case "$MODE" in
  export)
    export_runtime_deps
    ;;
  inject)
    inject_runtime_deps
    ;;
  *)
    echo "unsupported mode: $MODE" >&2
    exit 1
    ;;
esac
