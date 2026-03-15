#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$ROOT_DIR/client"
SERVER_DIR="$ROOT_DIR/server"
DB_PATH="$SERVER_DIR/data/super-nails.sqlite"
HOST_ARCH="$(uname -m)"
NODE_BIN="${SUPERNails_NODE_BIN:-$(command -v node || true)}"
NPM_CLI=""

preferred_nvm_node_from_file() {
  local requested_version=""
  local candidate=""

  if [[ -f "$ROOT_DIR/.nvmrc" ]]; then
    requested_version="$(tr -d '[:space:]' < "$ROOT_DIR/.nvmrc")"
    candidate="$HOME/.nvm/versions/node/$requested_version/bin/node"

    if [[ -x "$candidate" ]] && file "$candidate" | grep -q "$HOST_ARCH"; then
      echo "$candidate"
      return
    fi
  fi

  echo ""
}

find_matching_nvm_node() {
  local candidate
  local match=""

  for candidate in "$HOME"/.nvm/versions/node/v*/bin/node; do
    if [[ -x "$candidate" ]] && file "$candidate" | grep -q "$HOST_ARCH"; then
      match="$candidate"
    fi
  done

  echo "$match"
}

if [[ -n "$NODE_BIN" && -x "$NODE_BIN" ]]; then
  CURRENT_NODE_ARCH="$("$NODE_BIN" -p "process.arch" 2>/dev/null || true)"
  PREFERRED_NVM_NODE="$(preferred_nvm_node_from_file)"
  MATCHING_NVM_NODE="$(find_matching_nvm_node)"

  if [[ -n "$PREFERRED_NVM_NODE" ]]; then
    NODE_BIN="$PREFERRED_NVM_NODE"
  fi

  if [[ -z "$PREFERRED_NVM_NODE" && -n "$MATCHING_NVM_NODE" ]]; then
    case "$HOST_ARCH:$CURRENT_NODE_ARCH" in
      arm64:x64|x86_64:arm64)
        NODE_BIN="$MATCHING_NVM_NODE"
        ;;
    esac
  fi

  NODE_ROOT="$(cd "$(dirname "$NODE_BIN")/.." && pwd)"
  if [[ -f "$NODE_ROOT/lib/node_modules/npm/bin/npm-cli.js" ]]; then
    NPM_CLI="$NODE_ROOT/lib/node_modules/npm/bin/npm-cli.js"
  fi
fi

print_help() {
  cat <<'EOF'
Super Nails helper script

Usage:
  ./AGENTS.sh install
  ./AGENTS.sh dev
  ./AGENTS.sh build
  ./AGENTS.sh start
  ./AGENTS.sh typecheck
  ./AGENTS.sh lint
  ./AGENTS.sh preview
  ./AGENTS.sh health
  ./AGENTS.sh db-path
  ./AGENTS.sh doctor
  ./AGENTS.sh repair-native
  ./AGENTS.sh help

Commands:
  install    Install root, client, and server dependencies
  dev        Start the Vite app and Express API together
  build      Build the client and prepare the server
  start      Start the production server on localhost:3001
  typecheck  Run the client TypeScript typecheck
  lint       Run the client ESLint checks
  preview    Start the Vite preview server
  health     Check the API health endpoint
  db-path    Print the SQLite database path
  doctor     Print the Node/npm architecture being used by this script
  repair-native  Reinstall client/server deps and rebuild native modules
  help       Show this message
EOF
}

run_npm() {
  local workdir="$1"
  shift
  (
    cd "$workdir"
    if [[ -n "$NPM_CLI" && -x "$NODE_BIN" ]]; then
      PATH="$(dirname "$NODE_BIN"):$PATH" "$NODE_BIN" "$NPM_CLI" "$@"
    else
      npm "$@"
    fi
  )
}

case "${1:-help}" in
  install)
    run_npm "$ROOT_DIR" install
    run_npm "$CLIENT_DIR" install
    run_npm "$SERVER_DIR" install
    ;;
  dev)
    run_npm "$ROOT_DIR" run dev
    ;;
  build)
    run_npm "$ROOT_DIR" run build
    ;;
  start)
    run_npm "$ROOT_DIR" run start
    ;;
  typecheck)
    run_npm "$CLIENT_DIR" run typecheck
    ;;
  lint)
    run_npm "$CLIENT_DIR" run lint
    ;;
  preview)
    run_npm "$CLIENT_DIR" run preview
    ;;
  health)
    curl -fsS http://localhost:3001/api/health
    echo
    ;;
  db-path)
    echo "$DB_PATH"
    ;;
  doctor)
    echo "machine_arch=$HOST_ARCH"
    echo "node_bin=${NODE_BIN:-not-found}"
    if [[ -n "$NODE_BIN" && -x "$NODE_BIN" ]]; then
      echo "node_version=$("$NODE_BIN" -p "process.version")"
      echo "node_arch=$("$NODE_BIN" -p "process.arch")"
    fi
    echo "npm_cli=${NPM_CLI:-not-found}"
    ;;
  repair-native)
    run_npm "$CLIENT_DIR" install
    run_npm "$SERVER_DIR" install
    (
      cd "$SERVER_DIR"
      if [[ -n "$NPM_CLI" && -x "$NODE_BIN" ]]; then
        PATH="$(dirname "$NODE_BIN"):$PATH" \
          "$NODE_BIN" "$NPM_CLI" rebuild better-sqlite3 --build-from-source
      else
        npm rebuild better-sqlite3 --build-from-source
      fi
    )
    ;;
  help|-h|--help)
    print_help
    ;;
  *)
    echo "Unknown command: $1" >&2
    echo >&2
    print_help >&2
    exit 1
    ;;
esac
