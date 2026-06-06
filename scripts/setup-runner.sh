#!/usr/bin/env bash
#
# One-time install of the GitHub Actions self-hosted runner on this box.
#
# Get a registration token first:
#   GitHub repo -> Settings -> Actions -> Runners -> "New self-hosted runner"
#   -> copy the token shown in the `./config.sh --token <TOKEN>` line.
#
# Then run:
#   bash scripts/setup-runner.sh <TOKEN>
#
# The token is single-use and expires in ~1 hour. The runner connects OUTBOUND
# to GitHub (no inbound ports), and runs as the current user (developer) so it
# inherits the NOPASSWD systemctl rule used to restart the service.

set -euo pipefail

TOKEN="${1:?Usage: bash scripts/setup-runner.sh <RUNNER_TOKEN_from_github>}"
REPO_URL="https://github.com/grzlz/negocia-cdmx"
RUNNER_DIR="$HOME/actions-runner"

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

echo "==> Finding latest runner release"
VERSION="$(curl -fsSL https://api.github.com/repos/actions/runner/releases/latest \
  | grep -oP '"tag_name":\s*"v\K[^"]+')"
echo "    runner v${VERSION}"

TARBALL="actions-runner-linux-x64-${VERSION}.tar.gz"
if [ ! -f "$TARBALL" ]; then
  echo "==> Downloading $TARBALL"
  curl -fsSL -o "$TARBALL" \
    "https://github.com/actions/runner/releases/download/v${VERSION}/${TARBALL}"
fi

echo "==> Extracting"
tar xzf "$TARBALL"

echo "==> Configuring runner for $REPO_URL"
./config.sh --unattended \
  --url "$REPO_URL" \
  --token "$TOKEN" \
  --name "proliant-icarus" \
  --labels "self-hosted,linux,x64,proliant" \
  --work "_work" \
  --replace

echo "==> Installing + starting as a systemd service (will prompt for sudo)"
sudo ./svc.sh install "$USER"
sudo ./svc.sh start
sudo ./svc.sh status

echo "==> Runner installed. It will survive reboots and pick up pushes to main."
