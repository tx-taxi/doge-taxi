#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .local
for port in 4450 4451; do if ss -ltnH "sport = :$port" | rg -q .; then echo "Port $port already in use"; exit 1; fi; done
cp adapter/frontend-config.json frontend/mempool-frontend-config.json
(cd frontend && node generate-config.js)
nohup bash -c 'cd frontend && exec node node_modules/@angular/cli/bin/ng.js serve -c ltc --host 127.0.0.1 --port 4450 --proxy-config proxy.review.cjs' > .local/frontend.log 2>&1 < /dev/null & echo $! > .local/frontend.pid
nohup env PORT=4451 DOGE_FRONTEND_ORIGIN=http://127.0.0.1:4450 DOGE_SITE_ORIGIN=http://127.0.0.1:4451 DOGE_ROUTER_ORIGIN=https://tx.taxi node --watch adapter/server.cjs > .local/adapter.log 2>&1 < /dev/null & echo $! > .local/adapter.pid
echo 'DOGE local candidate http://127.0.0.1:4451 (Angular watch 4450)'
wait
