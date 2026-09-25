# Loading and centering follow-up

User reported pages failing to load and DOGE/DASH strip misalignment. Real browser check reproduced a DASH gateway crash: unhandled EPIPE on Angular hot-reload proxy socket after a client disconnect. DOGE shared the vulnerable path. Both directions now handle socket errors and clean up the peer; a closed browser cannot leave an unhandled write error. Watch process resumed on source change.

Native divider now uses half the current viewport/container width on desktop and mobile, replacing hardcoded left-edge offsets. Removed the matching hub-only translation to avoid double centering. Pending data remains subject to previously documented provider coverage; no placeholder projection added.

Actual browser screenshots1440/390 opened and inspected; divider720/195, no page errors, failed HTTP responses or overflow. Three browser open/reload/close cycles per gateway exercised actual ng-cli-ws connections; both gateways still served200 afterward. report.json and disconnect.json contain measurements. Original pre-fix screenshot/log observations remain in session; all prior scope limitations remain.
