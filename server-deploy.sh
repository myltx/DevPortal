#!/bin/bash

# 兼容：若被 `sh server-deploy.sh` / `source server-deploy.sh` 等方式误用，
# 先自举切换到 bash，避免后续 bash-only 语法（如 [[ ]]/local/数组）触发莫名其妙的语法错误。
if [ -z "${BASH_VERSION:-}" ]; then
    if command -v bash >/dev/null 2>&1; then
        exec bash "$0" "$@"
    elif [ -x /bin/bash ]; then
        exec /bin/bash "$0" "$@"
    else
        echo "[ERROR] 当前脚本需要 bash 执行，请使用：bash ./server-deploy.sh" >&2
        exit 1
    fi
fi

# Configuration
IMAGE_TAR="dev-portal.tar"
IMAGE_NAME="dev-portal:latest"
CONTAINER_NAME="dev-portal"
BACKUP_DIR="backups"
# 只保留最近 N 份备份（默认 1 份）
BACKUP_KEEP=1
# 为“上一版本镜像”打固定 tag，便于区分/回滚/删除
# 例如：dev-portal:previous
PREVIOUS_TAG_SUFFIX="previous"

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
        if ! docker load -i "$IMAGE_TAR"; then
            error "镜像加载失败（常见原因：磁盘空间不足或 tar 包损坏）。"
            return 1
        fi

        if docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
            info "当前镜像信息：$(docker image inspect "$IMAGE_NAME" --format '{{.Id}} {{.Created}}')"
            return 0
        fi

        warn "docker load 已执行，但未找到镜像：$IMAGE_NAME（tar 内可能没有该 tag）。"
        return 1
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
    load_image || return 1
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

    # 记录更新前的镜像 ID（用于在新版本启动成功后，精确删除旧镜像，避免磁盘堆积）
    local prev_image_id=""
    if docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
        prev_image_id=$(docker image inspect "$IMAGE_NAME" --format '{{.Id}}' 2>/dev/null || true)
    fi

    # 可选：给“上一版本镜像”打固定 tag（dev-portal:previous），避免变成 dangling 难以识别
    local prev_image_tag=""
    if [ -n "$prev_image_id" ]; then
        local image_repo previous_tag
        image_repo="${IMAGE_NAME%:*}"
        previous_tag="${image_repo}:${PREVIOUS_TAG_SUFFIX}"

        read -p "是否为当前镜像创建上一版本 tag（$previous_tag）？[Y/n] " do_tag
        do_tag=${do_tag:-Y}
        if [[ "$do_tag" =~ ^[Yy]$ ]]; then
            if docker tag "$prev_image_id" "$previous_tag" >/dev/null 2>&1; then
                prev_image_tag="$previous_tag"
                info "已创建上一版本镜像 tag：$prev_image_tag"
            else
                warn "创建上一版本 tag 失败（可能是 Docker 运行异常或镜像不存在）。"
            fi
        fi
    fi

    load_image || return 1
    info "重建容器..."
    $COMPOSE_CMD -f $COMPOSE_FILE up -d --force-recreate
    local current_container_image_id=""
    if docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
        current_container_image_id=$(docker inspect "$CONTAINER_NAME" --format '{{.Image}}' 2>/dev/null || true)
        info "容器使用的镜像 ID：$current_container_image_id"
    fi

    # 精确删除“上一次的镜像”（被新 load 覆盖后通常会变成 dangling），比全量 prune 更可控
    if [ -n "$prev_image_id" ] && [ -n "$current_container_image_id" ] && [ "$prev_image_id" != "$current_container_image_id" ]; then
        echo ""
        warn "检测到旧镜像（更新前）：$prev_image_id"
        warn "新镜像（当前容器使用）：$current_container_image_id"
        if [ -n "$prev_image_tag" ]; then
            info "旧镜像已被标记为上一版本 tag：$prev_image_tag（可用于回滚/对比/删除）"
            read -p "是否保留该回滚 tag（不保留则会删除对应旧镜像）？[Y/n] " keep_tag
            keep_tag=${keep_tag:-Y}
            if [[ ! "$keep_tag" =~ ^[Yy]$ ]]; then
                if docker image rm "$prev_image_tag" >/dev/null 2>&1; then
                    info "已删除回滚 tag（及对应旧镜像）：$prev_image_tag"
                else
                    warn "删除回滚 tag 失败（可能仍被其他容器引用或存在其他 tag 关联）。"
                fi
            fi
        else
            read -p "是否删除旧镜像（精确删除上一版本，释放磁盘）？[Y/n] " rm_prev
            rm_prev=${rm_prev:-Y}
            if [[ "$rm_prev" =~ ^[Yy]$ ]]; then
                if docker image rm "$prev_image_id" >/dev/null 2>&1; then
                    info "已删除旧镜像：$prev_image_id"
                else
                    warn "删除旧镜像失败（可能仍被其他容器引用或有其他 tag 关联）。"
                    warn "你可以稍后在菜单中选择「6. 清理未使用镜像」再处理 dangling。"
                fi
            else
                warn "已跳过删除旧镜像。"
            fi
        fi
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
    local lines
    lines=$(docker image ls -f dangling=true --format '{{.ID}}|{{.Size}}|{{.CreatedSince}}' 2>/dev/null || true)

    if [ -z "$lines" ]; then
        info "未发现 dangling 镜像，无需清理。"
        return 0
    fi

    echo "以下为可安全清理的 dangling 镜像（通常来自反复 docker load / 重复构建导致旧镜像失去 tag）："
    local i=1
    local ids=()
    while IFS= read -r line; do
        [ -z "$line" ] && continue
        local id size created
        id="${line%%|*}"
        size="${line#*|}"; size="${size%%|*}"
        created="${line##*|}"
        ids+=("$id")
        printf "%2d) %s  %s  %s\n" "$i" "$id" "$size" "$created"
        i=$((i + 1))
    done <<< "$lines"

    echo ""
    echo "输入 a 删除全部；输入序号（如：1 3 5）删除指定；输入 q 取消"
    read -p "请选择: " choice
    choice=${choice:-a}

    if [[ "$choice" =~ ^[Qq]$ ]]; then
        warn "已取消清理。"
        return 0
    fi

    if [[ "$choice" =~ ^[Aa]$ ]]; then
        info "开始清理全部 dangling 镜像..."
        # shellcheck disable=SC2046
        docker image rm $(docker image ls -f dangling=true -q) >/dev/null 2>&1 || true
        info "清理完成。"
        return 0
    fi

    local selected=()
    local token
    for token in $choice; do
        if ! [[ "$token" =~ ^[0-9]+$ ]]; then
            warn "忽略无效输入：$token"
            continue
        fi
        if [ "$token" -lt 1 ] || [ "$token" -gt "${#ids[@]}" ]; then
            warn "序号超出范围：$token"
            continue
        fi
        selected+=("${ids[$((token - 1))]}")
    done

    if [ "${#selected[@]}" -eq 0 ]; then
        warn "未选择任何有效镜像，跳过清理。"
        return 0
    fi

    info "开始删除选中的 dangling 镜像..."
    docker image rm "${selected[@]}" >/dev/null 2>&1 || true
    info "清理完成。"
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
