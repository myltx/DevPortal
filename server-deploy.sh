#!/bin/bash

# Configuration
IMAGE_TAR="dev-portal.tar"
IMAGE_NAME="dev-portal:latest"
CONTAINER_NAME="dev-portal"

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
    error "Docker Compose not found. Please install Docker first."
    exit 1
fi

# Detect Compose File
if [ -f "docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
elif [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
else
    error "No docker-compose.yml or docker-compose.prod.yml found!"
    exit 1
fi

# Functions
function load_image() {
    if [ -f "$IMAGE_TAR" ]; then
        info "Loading image from $IMAGE_TAR..."
        docker load -i "$IMAGE_TAR"
    else
        error "$IMAGE_TAR not found!"
        return 1
    fi
}

function check_env() {
    if [ ! -f ".env" ]; then
        warn ".env file not found."
        if [ -f ".env.example" ]; then
            read -p "Create .env from .env.example? [Y/n] " choice
            choice=${choice:-Y}
            if [[ "$choice" =~ ^[Yy]$ ]]; then
                cp .env.example .env
                info ".env created. PLEASE EDIT IT with your actual secrets!"
                read -p "Press Enter to continue..."
            fi
        else
            error "Neither .env nor .env.example found."
        fi
    else
        info ".env file exists."
    fi
}

function first_setup() {
    info "Starting First Setup..."
    check_env
    load_image
    info "Starting services..."
    $COMPOSE_CMD -f $COMPOSE_FILE up -d
    info "Done! Access your app at http://localhost:3001 (or server IP)."
}

function update_app() {
    info "Starting Update Process..."
    load_image
    info "Recreating containers..."
    $COMPOSE_CMD -f $COMPOSE_FILE up -d --force-recreate
    info "Update Complete."
}

function restart_app() {
    info "Restarting services..."
    $COMPOSE_CMD -f $COMPOSE_FILE restart
}

function show_logs() {
    $COMPOSE_CMD -f $COMPOSE_FILE logs -f
}

function shell_access() {
    docker exec -it $CONTAINER_NAME /bin/sh
}

function prune_images() {
    info "Pruning unused images (dangling)..."
    docker image prune -f
}

# Main Menu
while true; do
    echo "----------------------------------------"
    echo -e "   🚀 DevPortal Deployment Script"
    echo "----------------------------------------"
    echo "1. 🆕 First Time Setup (First Deploy)"
    echo "2. 🚀 Update App (Load Tar & Restart)"
    echo "3. 🔄 Restart Services Only"
    echo "4. 📜 View Logs"
    echo "5. 🐚 Enter Container Shell"
    echo "6. 🧹 Prune Unused Images"
    echo "q. ❌ Quit"
    echo "----------------------------------------"
    read -p "Select option: " option

    case $option in
        1) first_setup ;;
        2) update_app ;;
        3) restart_app ;;
        4) show_logs ;;
        5) shell_access ;;
        6) prune_images ;;
        q|Q) break ;;
        *) echo "Invalid option" ;;
    esac
    echo ""
done
