#!/bin/bash
# 版本同步脚本 — 以 specs/openapi.yaml 为真相源
# 用法: ./scripts/sync-version.sh [--check]
set -euo pipefail

ROOT="$(dirname "$0")/.."
cd "$ROOT"
ROOT="$(pwd -W 2>/dev/null || pwd)"

# 从 openapi.yaml 提取版本号
VERSION=$(tr -d '\r' < specs/openapi.yaml | grep -E '^\s+version:' | head -1 | sed 's/.*version:\s*//' | tr -d '"' | xargs)

if [ -z "$VERSION" ]; then
  echo "ERROR: Cannot extract version from specs/openapi.yaml"
  exit 1
fi

echo "Target version from openapi.yaml: $VERSION"

# ---- Check mode ----
if [ "${1:-}" = "--check" ]; then
  PKG_VER=$(node -e "const fs=require('fs');console.log(JSON.parse(fs.readFileSync('$ROOT/frontend/package.json','utf8')).version)")

  POM_VER=$(tr -d '\r' < backend/pom.xml | grep -A2 '<groupId>com.dailyschedule</groupId>' | grep '<version>' | sed 's/.*<version>//;s/-SNAPSHOT.*//;s/<.*//' | xargs)

  SYNC_OK=true
  if [ "$PKG_VER" != "$VERSION" ]; then
    echo "MISMATCH: frontend/package.json = $PKG_VER, expected $VERSION"
    SYNC_OK=false
  fi
  if [ "$POM_VER" != "$VERSION" ]; then
    echo "MISMATCH: backend/pom.xml = $POM_VER, expected $VERSION"
    SYNC_OK=false
  fi

  if [ "$SYNC_OK" = true ]; then
    echo "OK: All versions in sync ($VERSION)"
  else
    echo "Run './scripts/sync-version.sh' to fix."
    exit 1
  fi
  exit 0
fi

# ---- Sync mode ----

# Sync frontend/package.json
node -e "
const fs=require('fs');
const p=JSON.parse(fs.readFileSync('$ROOT/frontend/package.json','utf8'));
p.version='$VERSION';
fs.writeFileSync('$ROOT/frontend/package.json',JSON.stringify(p,null,2)+'\n');
"
echo "frontend/package.json → $VERSION"

# Sync backend/pom.xml — find the version line after com.dailyschedule groupId
POM="backend/pom.xml"
GROUP_LINE=$(grep -n '<groupId>com.dailyschedule</groupId>' "$POM" | head -1 | cut -d: -f1)
if [ -n "$GROUP_LINE" ]; then
  VERSION_LINE=$(tail -n +"$GROUP_LINE" "$POM" | grep -n '<version>' | head -1 | cut -d: -f1)
  if [ -n "$VERSION_LINE" ]; then
    TARGET_LINE=$((GROUP_LINE + VERSION_LINE - 1))
    if [ "$(uname)" = "Darwin" ]; then
      sed -i '' "${TARGET_LINE}s|<version>[^<]*</version>|<version>$VERSION-SNAPSHOT</version>|" "$POM"
    else
      sed -i "${TARGET_LINE}s|<version>[^<]*</version>|<version>$VERSION-SNAPSHOT</version>|" "$POM"
    fi
    echo "backend/pom.xml → $VERSION-SNAPSHOT"
  fi
fi

echo ""
echo "Done: version synced to $VERSION"
