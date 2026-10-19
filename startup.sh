#!/bin/sh
# Revive the Folio preview. Idempotent: if the app is already answering, exit.
if curl -sf -o /dev/null --max-time 1 http://127.0.0.1:8080/; then
  exit 0
fi
cd /workspace
npm run dev > /tmp/folio-dev.log 2>&1 &
exit 0
