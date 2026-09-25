# Local provider follow-up — 2026-09-25 UTC

Candidate remains incomplete. Removed calls to unsupported historical prices, pool distribution, RBF/CPFP history, address balance graph and full-block summary. Unknown historical reward no longer renders a false $0.00. Added the native batch outspend route using real cached/provider transactions. Queued requests recheck the provider cooldown before sending.

Observed upstream BlockCypher HTTP 429 at 02:33:49 UTC on `/addrs/DDogepartyxxxxxxxxxxxxxxxxxxw1dfzr/full?limit=25&txlimit=10000`; local persistent cooldown expires 03:00 UTC. This is temporary quota exhaustion, not evidence that historical indexing is absent. Cached transaction details render; uncached historical block strip, block transactions and address data remain unavailable. No fixture used to claim restored data. Historical mining remains separately unverified/unavailable; a token alone does not establish that capability.

Smallest operational requirement: sustainable access to DOGE historical block transactions and indexed address history, plus live tip/pending updates within an adequate quota. Historical mining requires a separately verified source; full acceptance still depends on that and the documented AuxPoW size definition.

Route HTTP errors and rendered content: route-results.json. Visible transaction-list checks: visible-block-check.json. Screenshots block-1440.png and block-390.png show actual provider failure, not success. Earlier centering and disconnect verification remains in ../centering-followup.
