# Castaway Angler

An iPhone fishing prototype with an illustrated shore, casting, forgiving hooking, light tension fights, three fictional fish profiles, and local collection records. M0 implementation: November 15, 2026. Primary phone target: iPhone 16 Pro Max.

## Play

[Open Castaway Angler](https://aingebritson.github.io/castaway-angler/). In iPhone Safari, use **Share → Add to Home Screen**, then open the installed game. Load it online once to prepare offline fishing. Hold the cast button, pull down, and release; tap on a bite, then hold/release to manage tension. Settings includes automatic hooking.

Keep an exported save outside the app. Saves are local to the browser/install and are not cloud-synced. A released fish still counts toward discovery and personal records. The test bench in Settings has its own separate save.

## Develop and verify

Use Node 24 LTS (`.nvmrc`). Run `npm ci`, then `npm run dev`. The local address uses `/castaway-angler/`, matching Pages.

Run `npm run typecheck`, `npm test`, `npm run validate`, `npm run sim`, and `npm run build`. `npm run preview` serves the production build, including offline support. The development server intentionally does not register a service worker.

GitHub Actions checks and deploys the main branch. `VITE_BASE_PATH` controls the hosting subpath; `VITE_BUILD_ID` identifies a release. The service worker includes a content fingerprint, retains recent caches for interrupted updates, and only activates an installed waiting update on request. Explicit reloads use the latest online shell, with an offline fallback.

See [M0 verification](docs/M0_VERIFICATION.md) for results and the remaining physical-phone gate.

## Start here

- [Current game specification](docs/SPEC.md): approved direction, gameplay rules, technical contracts, research/art work, and staged roadmap.
- [First build brief](docs/BUILD_M0.md): exact M0 scope, acceptance checks, phone playtest, and a ready-to-use implementation prompt.
- [Decisions](docs/DECISIONS.md): Andy's choices and the defaults adopted during revision.
- [Original Fable draft](docs/reference/FABLE_ORIGINAL.md): preserved unchanged for historical comparison; superseded by the current specification.

M0 stops here for Andy's playtest. Gathering, crafting, travel, NPCs, real species, and final art remain later work.
