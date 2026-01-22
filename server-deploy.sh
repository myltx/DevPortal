#!/bin/bash

# Configuration
IMAGE_TAR="dev-portal.tar"
IMAGE_NAME="dev-portal:latest"
CONTAINER_NAME="dev-portal"
BACKUP_DIR="backups"
# 只保留最近 N 份备份（默认 1 份）
BACKUP_KEEP=1

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper for printing
info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check Docker Compose command
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    error "未找到 Docker Compose，请先安装 Docker。"
    exit 1
fi

function detect_compose_file() {
    # Allow override (recommended for servers)
    if [ -n "${FORCE_COMPOSE_FILE:-}" ]; then
        if [ -f "$FORCE_COMPOSE_FILE" ]; then
            COMPOSE_FILE="$FORCE_COMPOSE_FILE"
            return 0
        fi
        error "FORCE_COMPOSE_FILE 指定的文件不存在：$FORCE_COMPOSE_FILE"
        return 1
    fi

    # Prefer prod compose when both exist, to avoid accidentally using a build-based compose file.
    if [ -f "docker-compose.prod.yml" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    elif [ -f "docker-compose.yml" ]; then
        COMPOSE_FILE="docker-compose.yml"
    else
        error "未找到 docker-compose.yml 或 docker-compose.prod.yml！"
        return 1
    fi
    return 0
}

# Detect Compose File
detect_compose_file || exit 1
info "当前工作目录：$(pwd)"
info "将使用 Compose 文件：$COMPOSE_FILE"

# Functions
function load_image() {
    if [ -f "$IMAGE_TAR" ]; then
        info "从 $IMAGE_TAR 加载镜像..."
        docker load -i "$IMAGE_TAR"
        if docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
            info "当前镜像信息：$(docker image inspect "$IMAGE_NAME" --format '{{.Id}} {{.Created}}')"
        else
            warn "未找到镜像：$IMAGE_NAME（docker load 可能未包含该 tag）"
        fi
    else
        error "未找到 $IMAGE_TAR！"
        return 1
    fi
}

function check_env() {
    if [ ! -f ".env" ]; then
        warn "未找到 .env 文件。"
        if [ -f ".env.example" ]; then
            read -p "是否根据 .env.example 创建 .env？[Y/n] " choice
            choice=${choice:-Y}
            if [[ "$choice" =~ ^[Yy]$ ]]; then
                cp .env.example .env
                info ".env 已创建，请根据实际情况修改配置！"
                read -p "按回车继续..."
            fi
        else
            error "既没有 .env 也没有 .env.example。"
        fi
    else
        info ".env 文件已存在。"
    fi

    if [ -f ".env" ]; then
        ensure_extension_key
    fi
}

function set_env_kv() {
    local file="$1"
    local key="$2"
    local value="$3"

    local tmp
    tmp=$(mktemp)

    # 保留原文件其他内容，仅替换/追加指定 key
    awk -v k="$key" -v v="$value" '
      BEGIN { found=0 }
      $0 ~ ("^" k "=") {
        print k "=\"" v "\""
        found=1
        next
      }
      { print }
      END {
        if (found==0) print k "=\"" v "\""
      }
    ' "$file" > "$tmp" && mv "$tmp" "$file"
}

function ensure_extension_key() {
    local key_line
    key_line=$(grep -E '^DEVPORTAL_EXTENSION_API_KEY=' .env 2>/dev/null || true)

    local need_prompt=0
    if [ -z "$key_line" ]; then
        need_prompt=1
    else
        # 简单判断空值/默认占位
        if echo "$key_line" | grep -Eq '^DEVPORTAL_EXTENSION_API_KEY\s*=\s*(""?\s*""?|\s*)$'; then
            need_prompt=1
        elif echo "$key_line" | grep -Eq 'please-change-me'; then
            need_prompt=1
        fi
    fi

    if [ "$need_prompt" -eq 0 ]; then
        info "已配置 DEVPORTAL_EXTENSION_API_KEY（用于 Chrome 插件调用 /api/match-credentials）"
        return 0
    fi

    warn "检测到未配置 DEVPORTAL_EXTENSION_API_KEY（否则插件会提示 Server not configured）"
    echo "说明：该 Key 需要与插件的 API_KEY 保持一致（请求头 x-api-key）。"
    read -p "请输入 DEVPORTAL_EXTENSION_API_KEY（直接回车跳过）： " ext_key
    if [ -z "$ext_key" ]; then
        warn "你选择跳过配置。后续如遇插件报错，请补充 .env 中的 DEVPORTAL_EXTENSION_API_KEY 并重建容器。"
        return 0
    fi

    set_env_kv ".env" "DEVPORTAL_EXTENSION_API_KEY" "$ext_key"
    info "已写入 .env：DEVPORTAL_EXTENSION_API_KEY"
    return 0
}

function backup_current_bundle() {
    mkdir -p "$BACKUP_DIR"
    local ts
    ts=$(date +%Y%m%d-%H%M%S)
    local dir="$BACKUP_DIR/$ts"
    mkdir -p "$dir"

    info "开始备份（目录：$dir）..."

    # Backup the incoming tar bundle itself (best effort)
    if [ -f "$IMAGE_TAR" ]; then
        cp -f "$IMAGE_TAR" "$dir/$IMAGE_TAR"
        info "已备份安装包：$IMAGE_TAR"
    else
        warn "未找到安装包 $IMAGE_TAR，跳过安装包备份"
    fi

    # Backup env/compose/script (best effort)
    if [ -f ".env" ]; then
        cp -f ".env" "$dir/.env"
        info "已备份 .env"
    else
        warn "未找到 .env，跳过备份"
    fi

    if detect_compose_file; then
        cp -f "$COMPOSE_FILE" "$dir/$COMPOSE_FILE"
        info "已备份 $COMPOSE_FILE"
    else
        warn "未找到 compose 文件，跳过备份"
    fi

    # Backup current image (best effort)
    if docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
        info "正在备份当前镜像（$IMAGE_NAME）..."
        docker save -o "$dir/image.tar" "$IMAGE_NAME"
        info "镜像已备份：$dir/image.tar"
    else
        warn "本机未找到镜像 $IMAGE_NAME，跳过镜像备份"
    fi

    info "备份完成。"

    cleanup_old_backups
}

function cleanup_old_backups() {
    local keep="${BACKUP_KEEP:-1}"
    if ! [[ "$keep" =~ ^[0-9]+$ ]]; then
        warn "BACKUP_KEEP 配置无效：$keep，跳过自动清理"
        return 0
    fi
    if [ "$keep" -lt 1 ]; then
        warn "BACKUP_KEEP 小于 1（$keep），跳过自动清理"
        return 0
    fi
    if [ ! -d "$BACKUP_DIR" ]; then
        return 0
    fi

    # 仅清理形如 YYYYMMDD-HHMMSS 的备份目录，避免误删其他目录
    local dirs
    dirs=$(ls -1d "$BACKUP_DIR"/*/ 2>/dev/null | sed 's:/*$::' | awk -F/ '{print $NF}' | grep -E '^[0-9]{8}-[0-9]{6}$' | sort -r)
    if [ -z "$dirs" ]; then
        return 0
    fi

    local total
    total=$(echo "$dirs" | wc -l | tr -d ' ')
    if [ "$total" -le "$keep" ]; then
        return 0
    fi

    info "自动清理旧备份：仅保留最近 ${keep} 份（当前 ${total} 份）"

    local to_delete
    to_delete=$(echo "$dirs" | tail -n +"$((keep + 1))")
    while IFS= read -r d; do
        [ -z "$d" ] && continue
        warn "删除旧备份：$BACKUP_DIR/$d"
        rm -rf "$BACKUP_DIR/$d"
    done <<< "$to_delete"
}

function rollback_from_backup() {
    if [ ! -d "$BACKUP_DIR" ]; then
        error "未找到备份目录：$BACKUP_DIR"
        return 1
    fi

    local bundles
    bundles=$(ls -1d "$BACKUP_DIR"/*/ 2>/dev/null | sed 's:/*$::' | sort -r)
    if [ -z "$bundles" ]; then
        error "备份目录为空：$BACKUP_DIR"
        return 1
    fi

    echo "可用备份："
    local i=1
    local arr=()
    while IFS= read -r line; do
        arr+=("$line")
        echo "$i) $(basename "$line")"
        i=$((i + 1))
    done <<< "$bundles"

    read -p "选择要回滚的备份编号: " choice
    if ! [[ "$choice" =~ ^[0-9]+$ ]]; then
        error "输入无效。"
        return 1
    fi
    local idx=$((choice - 1))
    local dir="${arr[$idx]}"
    if [ -z "$dir" ]; then
        error "编号超出范围。"
        return 1
    fi

    if [ -f "$dir/image.tar" ]; then
        info "加载备份镜像：$dir/image.tar"
        docker load -i "$dir/image.tar"
    elif [ -f "$dir/$IMAGE_TAR" ]; then
        info "加载备份安装包镜像：$dir/$IMAGE_TAR"
        docker load -i "$dir/$IMAGE_TAR"
    else
        error "该备份缺少镜像文件：$dir/image.tar 或 $dir/$IMAGE_TAR"
        return 1
    fi

    read -p "是否同时恢复 .env / compose 配置文件？（会覆盖当前文件）[y/N] " restore_cfg
    restore_cfg=${restore_cfg:-N}
    if [[ "$restore_cfg" =~ ^[Yy]$ ]]; then
        if [ -f "$dir/.env" ]; then
            cp -f "$dir/.env" ".env"
            info "已恢复 .env"
        else
            warn "备份中未找到 .env，跳过"
        fi

        if [ -f "$dir/docker-compose.yml" ]; then
            cp -f "$dir/docker-compose.yml" "docker-compose.yml"
            info "已恢复 docker-compose.yml"
        fi
        if [ -f "$dir/docker-compose.prod.yml" ]; then
            cp -f "$dir/docker-compose.prod.yml" "docker-compose.prod.yml"
            info "已恢复 docker-compose.prod.yml"
        fi
    fi

    detect_compose_file || return 1

    info "使用备份镜像重建容器..."
    $COMPOSE_CMD -f $COMPOSE_FILE up -d --force-recreate
    info "回滚完成。"
}

function first_setup() {
    info "开始首次部署..."
    check_env
    load_image
    info "启动服务..."
    $COMPOSE_CMD -f $COMPOSE_FILE up -d
    info "完成！请访问 http://localhost:3001（或服务器 IP）。"
}

function update_app() {
    info "开始更新流程..."
    check_env
    read -p "是否在更新前备份当前版本？[y/N] " do_backup
    do_backup=${do_backup:-N}
    if [[ "$do_backup" =~ ^[Yy]$ ]]; then
        backup_current_bundle
    else
        info "已跳过备份。"
    fi
    load_image
    info "重建容器..."
    $COMPOSE_CMD -f $COMPOSE_FILE up -d --force-recreate
    if docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
        info "容器使用的镜像 ID：$(docker inspect "$CONTAINER_NAME" --format '{{.Image}}')"
    fi
    info "更新完成。"
}

function restart_app() {
    info "重启服务..."
    $COMPOSE_CMD -f $COMPOSE_FILE restart
}

function show_logs() {
    $COMPOSE_CMD -f $COMPOSE_FILE logs -f
}

function shell_access() {
    docker exec -it $CONTAINER_NAME /bin/sh
}

function prune_images() {
    info "清理未使用的镜像（dangling）..."
    docker image prune -f
}

# Main Menu
while true; do
    echo "----------------------------------------"
    echo -e "   DevPortal 部署脚本"
    echo "----------------------------------------"
    echo "1. 首次部署（初始化）"
    echo "2. 更新应用（加载 tar 并重建）"
    echo "3. 仅重启服务"
    echo "4. 查看日志（Ctrl+C 返回）"
    echo "5. 进入容器 Shell（exit 返回）"
    echo "6. 清理未使用镜像"
    echo "7. 备份当前版本（镜像 + 配置）"
    echo "8. 回滚到备份版本"
    echo "q. 退出"
    echo "----------------------------------------"
    read -p "请选择操作: " option

    case $option in
        1) first_setup ;;
        2) update_app ;;
        3) restart_app ;;
        4) show_logs ;;
        5) shell_access ;;
        6) prune_images ;;
        7) backup_current_bundle ;;
        8) rollback_from_backup ;;
        q|Q) break ;;
        *) echo "无效选项" ;;
    esac
    echo ""

    read -p "是否继续执行其他操作？[y/N] " again
    again=${again:-N}
    if [[ ! "$again" =~ ^[Yy]$ ]]; then
        break
    fi
done
