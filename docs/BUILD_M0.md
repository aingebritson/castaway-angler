# Castaway Angler First Build Brief

November 13, 2026 · M0 fishing prototype · Primary device: iPhone 16 Pro Max

## Objective and authority

Build a small fishing toy that Andy can install on his iPhone, enjoy for a few minutes, interrupt safely, and return to without losing his catches. Prove that casting and light tension fights feel good before building the island game.

Read [SPEC.md](SPEC.md) and [DECISIONS.md](DECISIONS.md). This brief narrows the active scope to M0; later milestones are context. `reference/FABLE_ORIGINAL.md` is superseded historical material. The current folder contains planning documents only. Do not treat the roadmap as permission to implement the entire game.

This brief is ready for a future implementation request. Preparing these documents does not itself start development or publish a site.

## The playable experience

Launch into one portrait Rocky Point scene. Show a short instruction for dragging back to cast, then let the player fish. The lower water area contains one reachable zone; no navigation or equipment-selection screens are needed.

The loop is: ready → aiming → waiting/nibbling → bite → automatic landing or fight → reveal → Keep or Release → ready. Missed bites and escaped fish return to ready with a short message. Invalid casts cancel without consuming anything. Any active state can be paused; an interrupted app resumes through an explicit Resume button.

- Drag back and release to cast, with a readable landing marker. Do not add random aim error.
- Use a 5–20 second bite wait and a 3-second hook window. Distinguish nibble from bite visually and with optional sound.
- Default to tap-to-hook; provide a saved automatic-hook setting with identical catch odds and records.
- Hold to reel and release to lower tension. Small fish land automatically. A warning must give time to correct high tension or slack before escape.
- Keep tackle after any failure. Use unlimited test bait, with no bait inventory management.
- A reveal shows a labelled test specimen, length, size grade, new-profile/record banners, and Keep/Release. Do not invent biological facts or scientific names.
- A compact collection panel shows discovered test profiles, total catches, retained count, and personal-best lengths. Keep and Release both preserve records; only Keep increases retained count. No full field guide or detailed catch management is needed.
- Settings contain hook assistance, mute, reduced motion, save export/import, and saved/unsaved status. Pause fishing while menus are open.

## Prototype content and timing

Use simple shapes and fictional test profiles. Their purpose is to exercise interaction classes, not to represent real fish or final rarity balance.

| Profile | Untargeted selection share | Length min / typical / max | Intended interaction |
| --- | --- | --- | --- |
| Small test fish | 70% | 5 / 8 / 12 cm | Automatic landing in 1–3 seconds |
| Medium test fish | 25% | 15 / 22 / 35 cm | Light 5–15 second fight |
| Strong test fish | 5% | 35 / 45 / 70 cm | Manageable 15–25 second fight |

Use a bounded triangular distribution with the listed typical value as the mode for these synthetic fixtures. Grade each length against that profile's fixed distribution. The researched species model comes later; explicitly keep prototype data separate. Omit weight rather than invent a length-weight relation. All three are available in every island phase and month. Do not label their probabilities as the final rarity system.

Use one starter rig and a simple runner behaviour. Tune its values so both manual fights are winnable with ordinary hold/release timing. Keep all M0 constants in one documented balance file. Record any substantive timing changes after tests.

Include a debug-only overmatched scenario that demonstrates the 3–8 second clear escape and preserved equipment. It does not enter normal M0 random catches. Debug can also force each of the three profiles, select a seed/phase, and clear a separate test save. Keep debug controls out of the normal fishing interface.

The island uses the phone's local hour: dawn 05:00–07:00, day 07:00–18:00, dusk 18:00–20:00, night otherwise. A simple phase tint and label are enough. No geolocation, solar library, remote time service, or live weather is needed in M0. All phases remain legible and playable.

## Technical scope

Use the spec's TypeScript/Vite defaults and one scene renderer. Keep pure rules separate from rendering, with an injected clock and seeded random source. Pin verified compatible dependency versions. Support touch on iPhone and mouse input for desktop testing.

Implement only the schemas required for test profiles, scene/rig configuration, encounter state, catch records, settings, and saves. Do not build full regional species/quest/recipe frameworks in advance.

Use one serializable encounter with a unique ID and committed fish identity/length. Save the random-generator state. Appearance randomness must not change catches. Advancing the simulation by equivalent elapsed active time should give equivalent outcomes regardless of display refresh rate; use a bounded fixed simulation step or an equivalent stable approach.

Provide a small seeded distribution check. For example, 10,000 selections should approximate the configured 70/25/5 split within a declared tolerance of two percentage points per category. Also force each profile for deterministic interaction checks. This is not an economy model: no coins-per-hour report, regional tooling, or automatic play-balance dashboard.

CI should run type checks, relevant unit tests, active content validation, and a production build. Prepare hosting configuration for a GitHub Pages project subpath. Select the actual repository before publishing; do not invent a repository URL or claim deployment before it happens. Use a local browser build while hosting details remain unset.

## Persistence and interruption contract

Implement the full M0 save requirements from SPEC section 10:

1. IndexedDB save envelope with app/schema/content versions and current/previous valid generations, written in an ordered transaction flow.
2. Durable commits for gameplay transitions and settings. Fight checkpoints at most two active seconds apart, plus a best-effort snapshot on hide.
3. One atomic landing record and pending reveal. Keep/Release resolves that record once, even after reload or repeated input.
4. JSON file export/import, validation, supported migration handling, import preview/replacement confirmation, and preservation of a pre-import valid backup. Import never merges catches or doubles rewards.
5. Recovery from a corrupt current save using the previous generation. Invalid imports and unsupported newer versions leave the existing game intact.
6. A clear unsaved-state message and usable export when storage fails. Persistence permission denial does not prevent play.

On lock, app switch, menu open, visibility loss, or pointer cancellation: clear held reel input, pause active simulation, and preserve the current encounter. Returning requires Resume. Missing real-world time cannot become missed bites, fight damage, or accumulated simulation steps. If a process is killed before the latest checkpoint, resume from the previous valid checkpoint; explain any recovery without discarding caught records.

Cache the shell and prototype assets for offline use after a successful initial load. Stage updates until an idle point, save before reload, and keep IndexedDB independent of asset cache cleanup. Provide a version A/B update smoke test and a fixture demonstrating a supported save migration. Do not add cloud accounts or sync.

## Work sequence

1. Build the smallest playable cast-to-reveal loop using shapes, with deterministic rules and mouse/touch input.
2. Tune the automatic landing and light fight, add forgiving hooking/assist, and check portrait layout in a browser.
3. Add records, pending-reveal handling, save/recovery/export/import, pause/resume, offline install support, and safe updates.
4. Run the relevant checks and prepare a phone-testable build. Provide concise installation instructions for the chosen hosting destination.
5. Stop for Andy's phone playtest. Revise M0 feel based on feedback before adding M1a.

Do not add gathering, crafting, raft construction, currency, NPCs, quests, regional travel, lure retrieve, sight casting, traps, a museum, real species research, or final art generation in this milestone. Those systems have explicit later homes in the spec.

## Acceptance and evidence

### Automated and browser checks

- The same saved seed/state, clock, and inputs reproduce fish selection and size.
- Each test profile reaches the intended landing path. A routine release lowers tension safely; failure retains equipment. Debug oversized encounters resolve promptly.
- Manual and automatic hooking use the same encounter selection. Phase changes do not remove a committed fish.
- The landing record is created exactly once. Keep, Release, refresh, and repeated input never duplicate records or retained counts.
- Hiding during a wait, bite, fight, and reveal preserves the state without advancing active timers; held input is cleared.
- Save export/import round-trips collection and settings. Malformed/future saves are rejected safely; a migration fixture and corrupt-current recovery work.
- A deliberately failed save produces visible unsaved status and a usable export. Interrupted transactions retain a valid generation.
- The app loads and fishes offline after caching. An A-to-B app update preserves the save and does not interrupt an active encounter.
- Assets, manifest, and service worker work under a non-root repository path. Type checks, relevant tests, content validation, and production build pass.

Record actual results, not only a checklist of intended tests. Physical-phone results remain pending until Andy performs them; desktop emulation cannot certify them.

### Andy's iPhone 16 Pro Max playtest

Record the iOS version and app build, then try:

1. Open the hosted build in Safari, add it to the Home Screen, and launch the installed app.
2. Cast ten times. Judge whether aiming feels natural, bites are readable, and the main controls are comfortable with one thumb.
3. Try a manual fight and an automatically landed fish; test the auto-hook setting. Confirm ordinary successful cycles generally fit within a minute, excluding idle time on the reveal card.
4. Lock the phone during a bite and switch apps during a fight. Return and confirm the fish waits for Resume and the rod is not stuck reeling.
5. Keep one catch, release another, close/reopen, and check records and retained counts.
6. Export a save, make another catch, import the earlier save, and confirm the preview/replacement behaves clearly. Save an export outside the game for recovery testing.
7. After a successful load, use airplane mode and relaunch. Confirm fishing still works.
8. Check night tint, mute/reduced motion, safe areas, scrolling menus, and a short landscape interruption. Portrait play should remain readable and feel smooth at the 60 fps target.

M0 is complete only when the implementation checks pass and Andy says the interaction is enjoyable on the phone. If phone feedback or hosting access is pending, report “ready for phone test” and the specific remaining step, rather than claiming the milestone is complete.

## Implementation handoff prompt

Use this when starting development in the project folder:

> Build milestone M0 of Castaway Angler only. Read docs/SPEC.md, docs/DECISIONS.md, and docs/BUILD_M0.md; treat the reference draft as superseded. Use the approved defaults and make routine implementation choices without reopening settled design questions. Start with one playable fishing scene and placeholder test fish, then complete the save, interruption, offline, and verification requirements in the M0 brief. Record material departures and actual test results. Prepare a phone-testable build for my iPhone 16 Pro Max, report any remaining hosting or device-test steps, and stop for my playtest before adding M1a or later features.
