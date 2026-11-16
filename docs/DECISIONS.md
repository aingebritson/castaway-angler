# Castaway Angler Decisions

November 13, 2026 · Decisions for specification revision 1.1

## Confirmed by Andy

| Decision | Outcome |
| --- | --- |
| Initial audience | Personal prototype. Public release is not anticipated; do not deliberately make future release or migration difficult. |
| Island clock | Phone-local time. |
| Destination clocks | Actual local time after leaving the island. |
| Primary test hardware | iPhone 16 Pro Max. Record installed iOS version during testing. |
| Escape pacing | Target 45–90 active minutes, with optional discoveries and return visits. |
| Hooking | Forgiving manual tap by default, optional automatic hooking. |
| Essential progression | No mandatory multi-day waits; guaranteed routes to required supplies and clues. |
| Presentation and name | Portrait illustrated 2D scenes; Castaway Angler as the working title. |
| First build | Small fishing prototype, followed by an actual phone playtest before expansion. |
| Final art | Placeholder assets initially; choose a style through a visual comparison during prototyping. |

## Review changes accepted for this revision

| Area | Revised rule and reason |
| --- | --- |
| Fishing feel | Short ordinary fights, difficulty based on fish/rig rather than rarity, forgiving hooking, retained tackle after failure. Protect the relaxed experience. |
| Oversized fish | Occasional brief encounters with a clue and an early exit. Avoid repeated expensive, unwinnable fights. |
| Progression | All-hours starter fishing, free basic bait, active gathering alternatives, flexible provisions, and a finite guaranteed bearing search. Prevent dead ends. |
| Equipment economy | Meaningful upgrades combine catches, tasks, and knowledge. Remove automatic doubling of grind time and routine repair costs. |
| Scope | Split the island and first port into small playable increments. Optional island techniques do not delay reaching port. |
| Catch selection | Separate access from landing power; preserve targeted fish identity; describe rarity weights as per-species weights with conditional outcomes. |
| Size and records | Grade against a fixed species baseline; keep personal bests distinct from grade and real-world record notes. |
| Knowledge | Accumulate sightings, clues, and catches; show readable observations instead of requiring a multidimensional grid. |
| Saving | Export/import, local recovery generation, safe transactions, pause/resume, and update verification in M0. |
| Content extensibility | New locations using existing mechanics are data work; genuinely new mechanics may require code. |
| Collection | Research records/replicas cover release-only and sighting-only species. Legendary clues cannot require their own legendary. |
| Art | Separate swimming-view silhouettes from side-profile specimen art. |
| Reels | Introduce basic reels at the first port; island poles have a fixed-line profile. |

## Implementation defaults selected to make the spec concrete

These are design defaults under Andy's approval of the review, not additional biological facts or separately requested features. They may be tuned through playtests with the reason recorded here.

- Island phases: dawn 05:00–07:00, day 07:00–18:00, dusk 18:00–20:00, night otherwise. No location permission. Geographic sun phases begin after departure.
- M0 wait: 5–20 active seconds; hook window: 3 seconds; optional auto-hook has no reward penalty.
- Ordinary manual fight: 5–15 seconds. Exceptional later fights may reach 30–60 seconds after playtesting.
- No durability or ordinary tackle destruction. One consumable bait per genuine creature bite begins in M1a; M0 uses inexhaustible test bait.
- M1a catch bag: 20 individuals, unlimited Camp storage, unlimited stacked materials, no spoilage. M0 omits capacity management.
- Provisions: five smoked portions from suitable common fish. The three-species challenge is optional.
- Bearing: early random find is possible; after the first crafted rod upgrade, the third beach wreckage search guarantees it if still missing.
- First shop rod: initial target of 20–40 minutes including introductory quests; later costs do not automatically double.
- M0 content: three labelled synthetic profiles; researched island content begins in M1a.
- One successful record per legendary per save. Early release preserves collection credit and frees space; research payments arrive later.
- Real regions, lightly fictional ports, and stable portable save/content IDs. No accounts, cloud sync, or public-launch systems in the prototype.

## Work still deferred

Final art direction and name, regional research, ingredient quantities for M1a/M1b, later prices, and detailed new-region mechanics are resolved at the relevant milestone. None blocks M0.

The GitHub repository/hosting destination and installed iOS version are operational details for the implementation/phone-testing stage. This planning pass created no app, repository, or deployment.

## Recording future changes

Add the date, affected milestone, old and new behaviour, reason, and relevant playtest evidence. Update SPEC.md and the active build brief when a decision changes them. Do not treat old entries or the reference draft as competing current requirements.

## M0 implementation decisions on November 15 2026

- Andy selected `aingebritson/castaway-angler` as a new repository. GitHub rejected Pages on the private repository under the current plan; Andy explicitly approved making the repository public and using GitHub Pages.
- Pinned Phaser 4.2.1, Vite 8.3.8, TypeScript 7.0.2, Vitest 5.1.0, and Zod 4.6.7. Node 24 LTS is the supported development/CI runtime. Used plain DOM/CSS menus rather than adding Preact for this small scope.
- Used original vector placeholder art drawn in Phaser and SVG; no final art generation or biological research was added. Phaser 4 renders at CSS resolution for this prototype; performance and sharpness on the physical phone remain a playtest item.
- Kept test tools behind Settings and a separate `?debug=1` save. Forced test encounters use a shortened wait only in that test bench; regular play retains the 5–20 second wait.
- A browser update check exposed a stale-shell problem after a local rebuild. The service worker now fetches the latest shell on explicit online navigation, falls back offline, retains two previous asset caches, and fingerprints builds. Waiting-worker activation still requires an idle point and an explicit update action.
- M0 is ready for phone testing only after deployment and the recorded checks. It is not accepted as complete until Andy confirms the feel on the iPhone 16 Pro Max.

## M0 phone feedback and revision on November 15 2026

- Andy confirmed casting/landing markers, Keep/Release, interruption handling, saves, and offline play worked on his iPhone 16 Pro Max. The installed iOS version remains unrecorded.
- The persistent instruction card felt intrusive. Guidance now hides after the first catch and can be restored through Fishing tips in Settings. Migrated saves with catches start with compact controls.
- Small automatic catches were too easy and unengaging. All fish now require reeling. Small fights target 4–7 seconds with a wide green band; medium mechanics are unchanged. Strong fish use a narrower green band for modest added challenge, retaining three seconds to recover from excessive tension/slack.
- Save schema 3 adds Fishing tips, migrates schema 1/2 without changing catches or encounter identities, and preserves the existing content version.
- Haptics are requested but remain deferred by the iPhone web platform. [WebKit's vibration request](https://bugs.webkit.org/show_bug.cgi?id=288846) is closed WONTFIX; no reliable general vibration control is available to this Safari/Home Screen game. A native wrapper is the next platform option to evaluate for bite/hook/tension/landing feedback. No unsupported workaround or nonfunctional control was added.
- Recheck the revised small/strong fights and compact interface on the phone before accepting M0 and beginning M1a. M1a is not included in this revision.
