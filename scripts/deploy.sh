#!/usr/bin/env bash
# Deploy the latest image built by GitHub Actions onto this EC2 box.
# The box never builds — it only pulls a finished image and runs it.
#
# Usage (on the server, via `tcssh`):
#   bash ~/next-timecraft/scripts/deploy.sh
set -euo pipefail

IMAGE="ghcr.io/noravutc/next-timecraft:latest"
APP_DIR="$HOME/next-timecraft"

cd "$APP_DIR"

echo "==> pulling $IMAGE"
docker pull "$IMAGE"

echo "==> (re)starting container"
docker stop timecraft 2>/dev/null || true
docker rm timecraft 2>/dev/null || true
docker run -d --name timecraft \
  --env-file .env.production \
  -p 127.0.0.1:3000:3000 \
  --restart unless-stopped \
  "$IMAGE"

echo "==> removing old unused images"
docker image prune -f

echo "==> done: $(docker ps --filter name=timecraft --format '{{.Status}}')"
