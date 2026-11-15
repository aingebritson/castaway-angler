# M0 implementation and verification

November 15, 2026. Scope: the fishing prototype only. Physical iPhone acceptance remains pending Andy's playtest.

## Automated evidence

- TypeScript checks and production build pass on Node 24.22.1.
- All 24 automated tests pass. Rule/save tests cover deterministic selection, bounded sizes, all three landing classes, brief-release safety, tension/slack failures, oversized escape, phase boundaries, auto-hook parity, pause across clock jumps, exactly-once disposition, save validation and supported migration.
- IndexedDB tests cover ordered writes, recovery from the previous valid generation, interrupted transactions, preserved pre-import backups, corrupt-save blocking, and a subsequent successful save after a failed write.
- Offline-worker tests cover subpath precaching, no-network shell/assets, explicit activation, older hashed assets, unrelated-cache preservation, and fresh-shell fallback behavior.
- Seeded simulation: 10,000 selections; small 69.88%, medium 24.99%, strong 5.13%. All are inside the ±2 percentage-point tolerance.
- Production assets total about 1.6 MB uncompressed, excluding source maps (not shipped).

## Browser evidence

Tested the production build in the in-app browser at a 440 × 956 viewport. This is viewport testing, not a claim of running on a physical iPhone.

- Manual hooking and automatic hooking both reached catch reveals.
- A hold/release medium-fish fight reached the reveal in roughly fourteen seconds including transitions.
- A pending catch survived a reload, resumed paused, and was recorded exactly once after Keep.
- Release preserved collection credit; the collection showed the expected kept counts and personal bests.
- Export produced a valid schema-2 JSON save containing three catches. Import previewed and restored those catches into a clean browser origin.
- Simulated save failure left the game playable and visibly displayed “Not saved · export a backup.”
- The initial update test exposed a stale-shell/asset problem after replacing a local build. After the worker correction, a real local A-to-B update from `0.1.0-m0.1` to `0.1.0-m0.2` displayed the waiting-update action and preserved all three catches, two retained specimens, and both discoveries after activation.
- With the local preview server stopped entirely, the corrected app reloaded from its offline cache and completed another cast-to-reveal cycle. The previous collection remained present.

## Physical phone gate

Open the live link in Safari and use Share → Add to Home Screen. Test ten casts, a manual fight, locking/app switching, restart, save export/import through Files, and airplane-mode relaunch after one online load. Confirm thumb comfort, readable night lighting, stable performance, and that fishing feels enjoyable. The exact iOS version and physical-device frame rate have not been measured here.

No M1 systems, real species, final art library, accounts, or cloud saves were added.
