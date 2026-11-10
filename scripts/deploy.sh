#!/usr/bin/env bash
# Deploy an image built by GitHub Actions onto this EC2 box, and go back to
# the previous one if the new one doesn't come up healthy.
# The box never builds: it only pulls a finished image and runs it.
#
# Usage (on the server, via `tcssh`, or from the Deploy workflow):
#   bash ~/next-timecraft/scripts/deploy.sh            # the latest main build
#   bash ~/next-timecraft/scripts/deploy.sh <git sha>  # one exact build
set -euo pipefail

REPO="ghcr.io/noravutc/next-timecraft"
IMAGE="$REPO:${1:-latest}"
APP_DIR="${APP_DIR:-$HOME/next-timecraft}"
HEALTH_URL="http://127.0.0.1:3000/api/health"
HEALTH_TRIES="${HEALTH_TRIES:-30}" # x 2s = a minute to come up

cd "$APP_DIR"

run_container() {
  docker stop timecraft >/dev/null 2>&1 || true
  docker rm timecraft >/dev/null 2>&1 || true
  docker run -d --name timecraft \
    --env-file .env.production \
    -p 127.0.0.1:3000:3000 \
    --restart unless-stopped \
    "$1" >/dev/null
}

# 200 only when the app answers and reaches the database
healthy() {
  for _ in $(seq 1 "$HEALTH_TRIES"); do
    if curl -fsS -o /dev/null --max-time 5 "$HEALTH_URL"; then return 0; fi
    sleep "${HEALTH_SLEEP:-2}"
  done
  return 1
}

# the image id (not the tag) of what runs now: `latest` is about to move
PREVIOUS="$(docker inspect --format '{{.Image}}' timecraft 2>/dev/null || true)"

echo "==> pulling $IMAGE"
docker pull "$IMAGE"

echo "==> starting $IMAGE"
run_container "$IMAGE"

if healthy; then
  echo "==> healthy"
  # only now: pruning earlier would delete the image a rollback needs
  docker image prune -f >/dev/null
  echo "==> done: $(docker ps --filter name=timecraft --format '{{.Status}}')"
  exit 0
fi

echo "==> NOT healthy after $HEALTH_TRIES tries. Last logs:" >&2
docker logs --tail 30 timecraft >&2 || true

if [ -z "$PREVIOUS" ]; then
  echo "==> nothing was running before, so there is nothing to roll back to" >&2
  exit 1
fi

echo "==> rolling back to $PREVIOUS" >&2
run_container "$PREVIOUS"
if healthy; then
  echo "==> rolled back: the previous version is serving again" >&2
else
  echo "==> the previous version is not healthy either: look at the server" >&2
fi
exit 1
