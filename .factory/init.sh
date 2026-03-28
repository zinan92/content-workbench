#!/bin/sh
set -eu

REPO_ROOT="/Users/wendy/work/content-co/content-workbench"

cd "$REPO_ROOT"

mkdir -p data/workspaces .factory/library .factory/validation

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init >/dev/null 2>&1
fi

if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
  if [ "$NODE_MAJOR" != "22" ]; then
    echo "warning: repo targets Node 22 LTS; current shell is Node $(node --version)" >&2
  fi
fi

if [ -f package.json ] && [ ! -d node_modules ]; then
  npm install
fi
