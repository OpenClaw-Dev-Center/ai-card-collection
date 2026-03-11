#!/usr/bin/env bash
# deploy.sh — sync source to ~/ai-card-collection and restart services

set -e

SOURCE="$(cd "$(dirname "$0")" && pwd)"
DEPLOY_DIR="$HOME/ai-card-collection"

echo "==> Syncing source to $DEPLOY_DIR ..."
rsync -a --exclude='.git' --exclude='node_modules' "$SOURCE/" "$DEPLOY_DIR/"

# Copy hidden .env if it exists
if [ -f "$SOURCE/.env" ]; then
  cp "$SOURCE/.env" "$DEPLOY_DIR/.env"
fi

echo "==> Building and restarting services ..."
cd "$DEPLOY_DIR"
sudo docker compose up --build -d

echo "==> Done! Services are running at http://localhost"
sudo docker compose ps
