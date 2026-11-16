# Castaway Angler Game Specification

Revision 1.1 · November 13, 2026 · Prepared for Andy

## 1. Purpose and settled decisions

Castaway Angler is a relaxed fishing and crafting game for an iPhone Home Screen web app. You begin shipwrecked, craft your way to a raft, then explore real fishing regions, learn about their species, and pursue personal records. Build it in small playable increments, starting with one fishing scene.

This is the authoritative revised specification. It replaces the original Fable draft. [BUILD_M0.md](BUILD_M0.md) defines the first implementation only; [DECISIONS.md](DECISIONS.md) records the accepted choices. The original draft in `reference/` is historical context, not additional build requirements.

The numbered milestone controls what to implement now. Later sections describe the destination, not a requirement to build all its infrastructure in M0. Preserve these gameplay rules when choosing implementation details; record material departures in the decision log.

| Topic | Decision |
| --- | --- |
| Audience | Personal prototype for Andy. Public release is not anticipated; portable saves, source attribution, and replaceable assets keep that possibility open. |
| Primary test device | Andy's iPhone 16 Pro Max, in portrait and Home Screen standalone mode. Record its installed iOS version when testing. |
| World view | Illustrated 2D scenes, tap hotspots, and map travel. One-thumb controls. |
| Art | Placeholders first. Andy chooses the final style from a visual comparison during prototyping; final images can be generated with an image model. |
| Platform | Static TypeScript web app, prepared for GitHub Pages. No native App Store build or shortcut is required. |
| Players | Single player, no accounts, backend, analytics, or monetisation. |
| Clock | Phone-local time on the island; actual destination-local time and sun phases after departure. |
| Fishing | Forgiving tap-to-hook by default, optional automatic hooking, and hold/release fights for every fish. Small fish have a short, forgiving reel-in; stronger fish have a narrower green tension band. |
| Island pacing | Aim for 45–90 minutes of active play to escape. Optional discoveries and return visits add depth. No required multi-day wait. |
| Saves | Local, versioned saves; export/import and recovery from the first prototype. |
| Survival | No hunger, health, death, spoilage, equipment durability, or routine repairs. |
| Setting and name | Caribbean starting island; real regions and lightly fictional ports. Castaway Angler remains the working title. |

All numbers below are initial tuning values unless identified as an invariant. Tune them through phone playtests, and update the spec and decision log when changing the design.

## 2. Vision and design pillars

You wake up with an old fishing pole. Catching, gathering, and crafting let you explore further. After leaving the island, markets and people lead you toward unfamiliar waters, better equipment, and new species. Collecting knowledge and beating your own records are the lasting rewards.

When goals conflict, these pillars win in order:

1. **Chill.** Forgiving interactions, brief ordinary fights, and no punishment for putting the phone down. A lost fish leaves a useful story, not a repair bill.
2. **Discovery.** Learn through catching, sightings, clues, and experiments. The game records what you learn without exposing the complete hidden catch table.
3. **Real species and places.** Use researched species, habitats, and behaviour. Identify deliberate game simplifications in the field guide.
4. **Earned access.** Equipment and knowledge open new possibilities. Show an inviting glimpse of future water without repeatedly forcing unwinnable fights.
5. **Personal achievement.** Track species discoveries and personal bests. No leaderboards or competitive penalties.

Non-goals: 3D open world, multiplayer, combat, monetisation, public launch infrastructure, and a native app. Do not add a feature unless it creates a discovery or a useful new way to pursue one.

## 3. Core loops and pacing

| Loop | Initial target | Actions and reward |
| --- | --- | --- |
| Moment | Usually 15–60 seconds of active play | Cast, wait or retrieve, hook, land, reveal. Discover a creature, useful salvage, or a personal best. |
| Session | 5–15 minutes | Follow a clue, fish, sort catches, gather or craft, and progress toward an upgrade. |
| Long arc | Many optional sessions | Explore regions, refine knowledge, improve gear, find legendaries, and complete displays. |

On the island, crafting provides upgrades. At ports, buying supplies and equipment becomes the main general upgrade path; crafting remains valuable for regional bait, specialised lures, traps, and trade goods. Do not add recurring repair chores.

Every landed creature is recorded before choosing what to do with it. Keep it for sale, bait, crafting, a quest, or an eventual aquarium; alternatively release it. Selling or releasing never removes discovery or personal-best credit. Early release has no cash reward, but saves inventory space and preserves all collection progress. Research payments arrive with the biologist in M4.

The first session should produce a catch within a few minutes and an understandable upgrade goal. M1a should demonstrate one useful crafted upgrade within about 10–20 minutes. The full island escape targets 45–90 minutes, and can be completed in one sitting. Optional lure fishing, traps, unusual species, and the offshore wreck create reasons to stay or return.

## 4. Fishing controls and encounters

**Scene and casting.** Each spot is an illustrated portrait scene. Approximately the lower 55–60 percent is water divided into zones. Drag back and release to cast; a visible marker previews the landing point and reachable water. Keep primary controls in the lower thumb area. Tutorial guidance hides after the first catch; a saved Fishing tips setting can restore it. Experienced players see compact controls, the fight meter, and necessary outcome feedback. Invalid landings do not spend bait. Avoid random casting error in M0; introduce only mild, understandable accuracy differences if later playtests support them.

**Active techniques**

| Technique | Interaction | Introduction |
| --- | --- | --- |
| Bait and wait | A float twitches, then dips. Tap during a forgiving bite window; optional automatic hooking uses the same catch odds. | M0 |
| Lure retrieve | Hold to retrieve, release to slow or pause. A broad, visible speed band encourages experimentation. | M1c |
| Sight casting | Cast ahead of a visible individual using a compatible bait or lure. Targeting affects that fish, not an unrelated random draw. | M1c |

Bite waits begin at 5–20 seconds in M0. Later spots may use longer waits, but a cast that finds nothing must clearly resolve or offer useful feedback within 45 active seconds. Recast or cancel at any time. The default hook window is 3 seconds; do not reduce it below 2 seconds without a phone playtest decision. Nibble and bite cues differ visually and audibly, and audio is never required. Missing a bite has no equipment penalty. There is no auto-hook reward penalty.

**Fight.** Hold to reel, release to give line. Use a clearly labelled tension gauge with shape or text cues as well as colour. Fish size, species strength and behaviour, and rig capability determine difficulty. Rarity does not set fight duration.

- Every fish requires active reeling. Very small fish relative to rig power have a forgiving 4–7 second reel-in, followed by the landing animation.
- Ordinary manual fights target 5–15 seconds; substantial catches target 15–30 seconds.
- Exceptional and legendary fights may reach 30–60 seconds after playtesting. No mandatory two-minute fights.
- Reeling and fish surges increase tension. Releasing reduces tension while giving some distance back. Give a visible warning before failure; begin with 3 seconds of continuous excessive tension or slack before escape. A brief release must be safe. Narrow the green tension band for stronger fish, with its edges matching the actual warning thresholds. M0 uses 5–95% for small, 8–90% for medium, and 22–68% for strong profiles.
- The rod, line, hook, and lure are retained after escape. Consumable bait rules are in section 6.
- Behaviour archetypes are runner, diver, jumper, bulldog, and thrasher. M0 uses only a simple runner; later archetypes require demonstrated differences that remain readable with one control.

**Overmatched encounters.** Fish beyond the rig's landing ability can occasionally engage in reachable water. Begin with a maximum 10 percent chance to accept an otherwise eligible oversized encounter, and no more than one forced oversized encounter in five casts. Show the limitation promptly, let the player back out, and resolve escape within 3–8 seconds without tackle loss. Record the place, phase, and observed size class. Do not reveal an unseen species' name or exact size. These encounters advertise a future upgrade; they must never be required for progression. M0 exercises this path through a debug scenario only.

**Sight targets.** Spawn a visible encounter with a fixed ID, species, length, and position/path. A suitable cast one to three body lengths ahead creates an opportunity to hook that individual. Landing on it briefly spooks it. Once hooked, preserve its identity and size through the fight and reveal. Other fish do not intercept targeted casts in the initial implementation. Scene swimming silhouettes use the scene's viewing angle, separate from field-guide side profiles.

**Reveal.** Show the specimen, name, length, derived weight when available, size grade, and separate new-species and personal-best banners. A release-only creature can only be released after recording it. Keep and Use as bait are available only when valid. M0 uses clearly labelled fictional test profiles with Keep and Release only.

**Interruptions.** Pause all active encounter timers when hidden, locked, interrupted, or when an in-game menu covers fishing. Clear held inputs, snapshot the encounter, and require a Resume tap. A wall-clock jump cannot cause a missed bite or lost fight. Reloading restores the latest saved encounter snapshot; elapsed real time never advances that fight. Passive traps and resource timers follow separate real-time rules.

## 5. Catch model and clocks

### Eligibility and random selection

Distinguish **access** from **landing ability**. Access includes an unlocked spot, reachable zone, habitat, method, and any explicit tool requirement. Rod power and line strength determine whether a fish can be landed; they must not silently remove all oversized fish from reachable water. A fish finder reveals information and deep silhouettes; it is not a universal biological requirement for fish to bite.

For an untargeted cast:

1. Validate the zone, equipped method, and available bait. Build candidates with matching hard access requirements and nonzero phase, month, and affinity weights.
2. Roll against the zone's method-appropriate junk table if it has one. Junk lands without a creature fight.
3. For a creature opportunity, draw a species using the weights below; roll its length from the configured size distribution restricted to the hook's minimum supported length. A species whose entire size range is below that minimum is ineligible.
4. Compare the individual with rig capability. Apply a short forgiving reel-in, an ordinary fight, or the reduced oversized-encounter chance. A rejected oversized opportunity causes no bite and spends no bait; the cast may seek another opportunity within its time limit.
5. Persist the selected individual when the bite is committed. It cannot change species or size on reload, hooking, or reveal.

For a targeted cast, use the existing sight encounter instead of the species and size draws. Check method and affinity compatibility and apply the same landing classification. A hook's upper preferred length indicates an oversized opportunity, not an absolute candidate exclusion.

If the candidate and junk pools are empty, do not normalise zero weights, consume bait, or wait indefinitely. Return to ready with a broad hint such as “Try another bait or shallower water.” If only junk is eligible, roll its normal chance and otherwise resolve as no interest; never try to draw a creature from an empty pool. If only creatures are eligible, skip the junk draw. Do not expose hidden species identities. The starter spot must never have an empty viable pool.

`weight = rarityWeight × phaseModifier × monthModifier × baitOrLureAffinity × conditionModifier`

| Rarity at this location | Initial per-species weight |
| --- | --- |
| Common | 100 |
| Uncommon | 30 |
| Rare | 8 |
| Epic | 1.5 |
| Legendary | Separate encounter rule |

Normalise over eligible species, not over rarity tiers. Approximate 70/22/7/1 percent shares are optional mid-progression tuning goals for a documented reference pool, rig, and time—not guaranteed odds. Starter pools can be entirely common. Reports must distinguish encounter opportunities, actual bites, junk, oversized rejections, and successful landings. Do not falsify seasonal behaviour to force a global rarity ratio.

### Clock policy

Persist timestamps in UTC. Inject the clock into game rules; never use the current host time implicitly in tests.

**Island:** derive hour and month from the phone's current time zone. Use these deliberately simplified phase boundaries: dawn 05:00–07:00, day 07:00–18:00, dusk 18:00–20:00, night 20:00–05:00. Intervals include their start and exclude their end. This aligns the island with the player's routine without requesting their location. It does not claim to reproduce local sunrise. Island species use Caribbean monthly ecology indexed by that month; do not infer the player's hemisphere or local seasons. Disclose the simplified island clock in the journal/settings. Re-evaluate the phone time zone on resume.

**After departure:** each location has researched coordinates and an IANA time zone. Derive its local date and month from the same UTC instant. Use SunCalc solar events for that geographic date: dawn from civil dawn to sunrise, day from sunrise to sunset, dusk from sunset to civil dusk, night otherwise. Handle dates whose events cross UTC midnight. For polar dates with absent events, use solar altitude: above the horizon is day, below civil twilight is night, and the intervening band is dawn while rising and dusk while falling. Verify the pinned library's units and absent-event representation; never assume every day has sunrise and sunset. [SunCalc documentation](https://github.com/mourner/suncalc)

Capture phase and month when an encounter is committed. A fish already biting does not vanish when the phase changes. New encounters use the current phase. Clock changes and daylight saving changes may change future availability, but never subtract inventory or advance an active fight.

**Season and conditions:** occurrence records carry 12 monthly modifiers and four phase modifiers, each 0–2. Zero means absent. Southern hemisphere differences are recorded in regional data. Moon, stylised tide, and generated weather enter in M4. Any generated conditions are explicitly game approximations, not actual forecasts or navigation information.

**Progression invariant:** at every main progression stage, every calendar month and phase must offer a complete route forward using available tools and resources. Optional seasonal species, trophies, and legendary encounters may have narrower windows. Early collections and essential quests cannot require them.

### Size and records

Store a species' supported minimum, typical catch length, maximum, measurement convention, and length-weight relation where available. Weight in grams is `a × lengthCm^b`; show no invented weight when parameters are unavailable. Use a bounded, right-skewed distribution with median near the researched typical length. Select and record its parameters before adding that species.

Define one fixed baseline size distribution per species. Grade a catch by its percentile in that baseline: Small below 25, Average from 25 to below 75, Large from 75 to below 95, Trophy from 95 to below 99.5, Record grade 99.5 and above. The grade boundaries do not change with equipped gear or location. Gear may bias sampled sizes upward, not redefine what counts as a trophy. “Record grade” is a size category, not a claim of a world record. Personal-best banners are calculated independently, with separate length and weight records if they differ.

Large hooks and suitable bait can bias sizes toward larger individuals. Aim for fewer than 1 percent above 90 percent of supported maximum with baseline gear where the species model permits it; treat that as a tuning check, not a substitute for real size data. Validate measurement units and the plausible weight range.

### Legendary and non-fish encounters

Start with one named legendary individual per region in M4. It has three to five clue dimensions chosen from zone, time, seasonal window, rig, and later conditions. Once its conditions are met, start at a 10 percent eligible-cast encounter chance. Its fixed size must remain plausible against researched records. It can be successfully recorded once per save, including on release; losing a fight leaves it available. Preserve a permanent commemorative entry. Legendary catches never block essential travel or ordinary collection completion.

Crustaceans, cephalopods, molluscs, and echinoderms use their appropriate trap, net, hand, or fishing methods. Sightings such as turtles and dolphins contribute research records without catch inventory. Junk includes useful materials and optional rumours. Track species conservation facts separately from location-specific game retention policy: normal, release-only, or sighting-only. Resolve policy from regional research before publishing content, and never require a protected specimen as a consumed ingredient.

## 6. Gathering, inventory, and crafting

### Starting supplies and inventory rules

In the full island, start with an old pole and its attached basic line, rusty hook, and improvised float. The first shore hotspot provides free starter bait immediately, with no tool or daylight requirement. M0 has an inexhaustible test bait supply; consumable bait begins in M1a.

- Basic sand-flea bait and shells are always collectible without a timer. Replacement shell tackle is always available; equipped tackle is not consumed by ordinary failure.
- Spend one consumable bait unit on the first genuine creature bite of a cast, whether hooked or missed. Nibbles, junk, invalid casts, empty pools, and cancellation before a bite spend none. Lures are reusable. “Use as bait” converts one eligible retained or just-landed specimen into a specified bait item atomically.
- Materials stack without a capacity limit in the personal prototype. Key items have a separate protected inventory and cannot be sold, discarded, or used in another recipe.
- From M1a, carry up to 20 individual creature specimens; Camp storage is unlimited. On a full catch bag, keep the new reveal pending while choosing Release or swapping and releasing an existing specimen. Never silently delete a catch. M0 uses unlimited test catch storage and omits capacity management.
- Fish do not spoil. Ordinary retained specimens cannot later become live aquarium specimens: a livewell must be equipped when they are caught. Store that eligibility with the catch.
- Catch records retain a unique ID, species, length, optional weight, location, timestamp, and rig. Selling, crafting, bait conversion, and donation consume inventory specimens, never historical records. Repeated taps cannot award or consume the same catch twice.
- Crafting checks known recipe, tools, ingredients, and output space before making one atomic transaction. Retained tools are not consumed. Locked ingredients produce a useful hint, never a blank dead end.

### Materials and gathering

| Material | Source | Main purpose |
| --- | --- | --- |
| Palm fronds and coconuts | Grove | Fibre, floats, bait, woven sail |
| Driftwood and stones | Beach and Rocky Point | Tools, campfire, raft |
| Vines | Grove | Lashings |
| Bamboo | Grove interior after making a knife | Better rod, raft, trap |
| Shells | Beach and tide pools | Hooks and lure flash |
| Fish bones and fish flesh | Preparing an eligible kept fish | Needle, hooks, smoked provisions, bait |
| Feathers | Beach | Optional feather lure |
| Rope, canvas, bottles, planks | Wash-up and fishing junk | Optional shortcuts, crafting, clues |

Tap a hotspot to gather a small batch. Timed regrowth and daily wash-ups may offer convenient bonuses, but every mandatory material has a repeatable active-gathering source. After a hotspot's convenient stock is exhausted, a repeatable short search action can obtain the same essential material. Never put the only route to a required quantity behind a real-time wait. Bamboo is gated by a craftable knife, not by a calendar date.

### Recipe ladder and escape

| Stage | Required recipes or tasks | Optional branches |
| --- | --- | --- |
| Toolmaker | Hammerstone, stone knife, cordage, shell hook | Bone hook, improved float, sinker |
| Angler | Bamboo rod, braided line, campfire, drying/smoking rack, prepare fish, smoke fish, bone needle | Feather lure, woven trap, torch, bait basket |
| Raft | Hull, lashings, mast, woven sail, steering oar, provisions, recovered bearing | Cosmetic improvements and supply surplus |

The old rod remains usable throughout. A torch opens additional dark coves and makes optional night exploration easier; Rocky Point's starter shallows remain usable at every hour without it.

Before implementing M1a, define exact ingredient quantities and outputs for that increment. Before M1b, finish the required recipe graph and verify it has a reachable path from starting inventory. The old “about 16 recipes” count is not a fixed limit; bundled raft components may be one clearly explained recipe where that improves pacing. Do not add recipes solely to reach a count.

Provisions require five smoked portions made from any eligible common retained fish; three different species are an optional bonus objective. Preparing a fish yields flesh plus bones in one transaction, so the bone needle cannot consume the only source of provisions. Research at least three suitable starter species whose combined availability and quantity support the whole escape route at every phase and month.

Introduce the navigation bearing as a visible search objective after the first crafted rod upgrade. It may appear early in fishing junk. If still missing, the third completed Search the wreckage action at the beach guarantees it. Searches are available immediately when that objective unlocks and consume neither scarce tools nor fish; they have no daily reset or eight-species prerequisite. Once obtained, the bearing remains a protected key item.

Raft launch checks the assembled components, provisions, and bearing. Consumption and the new travel unlock commit together. Confirm the launch as a deliberate player action; preserve the ability to revisit the island in M2. An ending card in M1b stands in for the not-yet-built port.

After the island, recipes come from shops, quests, and discoveries. Use them for new fishing opportunities and regional specialities, not upkeep.

## 7. World, travel, and access

Regions contain locations; fishing locations contain zones. Ports contain shops and people. Reuse these structures for ordinary new content. A genuinely new mechanic such as changing flood levels may require a small tested code extension; that is not automatically a defect in the content model.

**Castaway Island:** Beach is the arrival hub and source of salvage/bait; Palm Grove provides materials; Rocky Point provides dependable starter fishing and tide pools; Lagoon Flats introduces optional sight casting; Camp holds storage, crafting, and the journal. Start with only the scenes/overlays needed for the current milestone. The offshore wreck is visible but reachable only on a later return with a boat.

**Regional roadmap.** These are research candidates, not verified occurrence or protection claims. Content selection must confirm the precise habitats and methods before implementation.

| Region | Candidate discoveries | Distinctive play |
| --- | --- | --- |
| Castaway Island, Caribbean | Small reef fish, bonefish, barracuda, spiny lobster | Gathering, crafting, optional lure/sight fishing |
| Caribbean port and waters | Permit, tarpon, groupers, mahi-mahi | Markets, NPC clues, skiff, additional habitats |
| Amazon, Rio Negro | Peacock bass, piranha, arapaima, redtail catfish, payara | Flood-related habitat access, once researched |
| Alaska, Kenai and coast | Pacific salmon, halibut, trout, crab | Runs and strong seasonal variation |
| Great Barrier Reef | Coral trout, trevally, red emperor, offshore game fish, observation species | Southern seasons, offshore fishing, researched access restrictions |
| Later possibilities | Great Lakes, Norwegian fjords, Mekong, Japan, East African lakes, Patagonia | Add only when the existing loop warrants another region |

Use real regions and habitats with lightly fictional ports and people. Travel is instant after a brief voyage card. Boat capability opens nearby water; charts or passage unlock distant regions. Purchasing access creates a permanent travel unlock—do not require repeat fares to return to essential shops or the starting island. There is no fuel or boat upkeep.

| Stage | Newly available | Visible future possibilities |
| --- | --- | --- |
| Washed up | Starter shallows, free bait, basic gathering, all-hours play | Further water, large distant silhouettes |
| Toolmaker | Knife, cordage, bamboo, basic rigs | Larger catch sizes, specialised methods |
| Angler | Bamboo rig, raft preparation; optional lure/torch/trap branches | Offshore wreck and open sea |
| Raft | First port | Shop equipment, skiff destinations |
| Deckhand | First shop rig, basic reel, skiff, quests | Offshore spots and regional charts |
| Skipper | Larger boat, additional passive methods | Distant regions, deep-water clues |
| Voyager | Regional rigs, fish finder | Legendary clues and collection displays |
| Master | Top rigs and accumulated knowledge | Personal records and optional collection goals |

Equipment improves reach, target size, and control. Knowledge can reveal a compatible bait or technique before brute-force upgrades are affordable. Do not gate all rare fish behind high power: an unusual small species can be an early discovery.

## 8. Economy and equipment

Coins begin at the first port. Sell eligible catches and crafted goods, complete NPC quests, and later fulfil optional orders or research tasks. Trophy premiums reward size; begin with three times the normal size-adjusted sale value for Trophy and Record grades, then tune. Keep sales and inventory consumption atomic.

Spend coins on equipment, specialised bait, recipes, boats, charts, storage, and eventual displays. Essential basic fishing remains possible when broke. Do not introduce equipment destruction, recurring repairs, repeated essential travel charges, or buy/craft/sell loops that generate unlimited profit without fishing or gathering.

| Equipment | Purpose and introduction |
| --- | --- |
| Rod | Cast range and power. Old, bamboo, then four potential shop tiers. |
| Reel | Line capacity and control. Basic reel at the first port in M2; advanced options in M2b/M3. The island pole uses a simple fixed-line profile, not a missing required slot. |
| Line | Landing capability and tension tolerance. No routine replacement cost. |
| Hook | Minimum and preferred size window; oversized individuals remain possible. |
| Bait | Species affinity, with regional tags such as crustacean, cut fish, live fish, squid, fruit, or dough. |
| Lure | Type, depth, and forgiving retrieve band. Reusable. |
| Traps and nets | New collection methods for suitable creatures and bait. Woven trap in M1c; additional tools in M2b/M3. |
| Boat | Permanent access to additional spots; raft, skiff, and later seaworthy upgrades. |
| Fish finder | Deep-water information and silhouettes; available species hints without revealing every identity or catch condition. M3. |
| Utility | Torch for optional dark areas; tackle box for saved rigs; cooler for capacity; livewell for future live specimens. |

The first shop rod targets 20–40 minutes of purposeful play after arrival, including introductory quests. Later upgrades mix affordable coin costs with useful tasks, recipes, or discoveries. Do not automatically double grind time each tier. Evaluate earnings using a declared ordinary player policy, including misses, fight duration, travel/menu time, and catch disposition; perfect-play simulation is not a forecast of player progress.

**Traps:** bait once, place in a researched zone, and calculate the haul from stored timestamps when checked. Optional soak times begin at 1–8 hours; capacity caps the haul. Use a single resolution ID so a reload cannot collect the same haul twice. They never gate escape or essential progression. A hand/net alternative is required for any essential ingredient otherwise available only from a trap. Specify how elapsed intervals cross phase/month boundaries before adding seasonal trap species; do not evaluate the whole soak using only the return time. Backward clock movement yields zero elapsed time, never a negative haul.

**Orders:** introduce a few optional rotating requests in M2b. They supplement permanent shops and quest chains. Never demand an out-of-season species for an essential unlock, expire a required quest, or punish an absence from the game.

## 9. Field guide, journal, people, and collection

### Knowledge and personal records

Store knowledge as accumulated evidence, not one mutually exclusive state. An entry can hold a named rumour, an anonymous silhouette observation, a sighting, and a verified catch together. Derive a display state from that evidence without discarding earlier knowledge. Unidentified observations remain anonymous until a legitimate identification connects them to a species; an underwater miss does not automatically reveal the name.

Unknown entries may show numbered slots and collection totals. Named rumours reveal only their supported information. A first catch reveals the specimen, researched description, facts, and catch statistics. Sighting-only animals reveal their appropriate observation entry without needing a catch.

The main journal view uses readable evidence cards, for example: “Caught near the mangroves at dusk using shrimp.” Mark player observations separately from NPC tips and show their sources. One catch proves that a combination occurred; it does not prove the best bait, preferred phase, an absence in other conditions, or a complete seasonal pattern.

Filter by species, place, time, and bait. Optional summaries can show the conditions already observed, but there is no requirement to fill a multidimensional grid or catch every species in every month. Collection completion counts species evidence appropriate to that species, not every possible experiment.

Record first discovery, catch/sighting count, length and weight personal bests, date, place, rig, and provenance for rumours. Keep museum qualification and catch disposition separate from discovery credit. Scientific names and researched real-world record notes belong in detailed entries; do not imply the player's record is an official world record.

### Captain's log and NPCs

On the island, the castaway's journal records first catches, personal bests, meaningful escapes, crafting goals, and found clues. After departure it becomes the captain's log, adding quest steps, trap hauls, and legendary clue checklists. Players can pin entries and keep a free-text note per location. Avoid duplicate spam from repeated failed catches.

The first port begins with one NPC and a short three-step quest chain that demonstrates useful information as a reward. Expand in M2b to harbourmaster, fishmonger, tackle seller, and old salt as needed. Add the biologist in M4 and curator in M5. Do not build three to five fully scripted people at every port before the first quest has proved worthwhile.

Quest types include catch, size, optional time condition, set completion, crafting/delivery, research release, and salvage recovery. Main quests always have available routes; rare seasonal requirements belong to optional quests. Rumours are truthful, sometimes incomplete, and reveal one useful dimension—where, when, bait, or method. Track whether a clue is obtainable with the player's current equipment and progression.

### Museum and aquarium

M5 adds displays and the trophy wall. Ordinary retained specimens may be donated; aquarium specimens require a livewell at the time of capture. Release-only and sighting-only species qualify through recorded game observations or research records, displayed as illustrations, replicas, or plaques. They never require an impossible retained specimen. An early recorded release remains useful when the museum opens later.

A regional base wing requires its specified non-legendary species records. Completing it yields an optional legendary clue; no legendary is required to earn its own clue. Named legendaries receive a commemorative display after their one successful record, regardless of release. Seasonal completion remains a long-term optional goal; partial wings and trophy displays are usable immediately.

## 10. Technical architecture and persistence

### Stack and boundaries

Build a static TypeScript web app. Start with Vite, Vitest, Phaser 4 for the fishing scene, and simple DOM/CSS menus. Preact is an available default as menus grow; do not build an application framework before it is useful. Validate shipped content and saves with Zod or an equivalent small schema library.

At revision time, Phaser's official page lists 4.2.1 dated July 9, 2026. Verify compatible stable packages at implementation, pin resolved versions, and read that version's documentation. If a concrete phone/rendering problem blocks M0, record it and use a simpler canvas implementation; do not maintain multiple rendering engines. [Phaser releases](https://phaser.io/download/phaser4)

| Area | Responsibility |
| --- | --- |
| `sim/` | Pure game rules for encounters, fights, crafting, and later economy. Inject random source, elapsed time, and clock context; no browser APIs or implicit current time. |
| `content/` | Versioned species, occurrences, locations, items, recipes, quests, and balance values as needed by the current milestone. |
| `state/` | Serializable state, validated commands, and migrations. Gameplay transactions have unique IDs and can be retried safely. |
| `scenes/` and `ui/` | Render state and send commands. Rendering frame rate must not change catch probabilities or fight outcomes. |
| `platform/` | Storage, clock acquisition, visibility/input lifecycle, audio, installation, and service worker integration. |

Use a seeded random generator with saved internal state and an injectable clock from M0. Only committed gameplay consumes gameplay randomness; decorative ripples use a separate source. Debug controls can select a seed, phase, test encounter, and hook assistance. Add location/inventory overrides when those systems exist. Do not persist debug overrides into normal play accidentally.

M0 needs a small repeatable distribution check, not a regional economy simulator. Add the richer simulator in M1a and extend it only as the mechanics arrive. A future command may accept location, rig, cast count, time, seed, and player policy, then print eligible pools, bites, landings, fight time, and available progression resources. Coins per hour belongs to M2.

Validate required fields, bounds, enum values, and cross-references for the active milestone. Verify 12 monthly modifiers, nonnegative finite weights, supported measurement units, valid ingredient graphs, and reachable progression as those records arrive. M0 test profiles use an explicit prototype schema and need no fabricated biological sources. Real biological facts require sources from M1a. Missing art uses a labelled fallback.

### Save contract from M0

Use IndexedDB for a versioned save envelope with application ID, schema version, content version, timestamp, and payload. Keep current and previous known-good generations. Both generations are local recovery aids; only an exported file survives deletion of all site data.

- Save committed changes such as casts, bites, reveals, dispositions, settings, and later crafting/purchases through an ordered queue. Write current and previous generations in one transaction so an interrupted write leaves a valid generation.
- Keep frame-by-frame animation out of persistent game state. Checkpoint active encounter state at transitions, with no more than two active seconds between fight checkpoints; also attempt a snapshot on hide. A sudden process kill may replay at most the unsaved interval, never inflict offline fight damage.
- On landing, commit the unique catch record and pending reveal together. Keep/Release resolves that pending record once. Restore pending reveals after reload and do not grant records or inventory twice.
- On load, validate before applying. If current is invalid, recover the previous valid generation with a clear message. If neither is valid, preserve the stored data and offer import or an explicit new-game choice; do not silently overwrite progress.
- Export a portable JSON file from M0. Import validates application/schema/content versions, migrates supported older saves, and previews the incoming collection before the player chooses replacement. Preserve a valid pre-import backup. Reject unsupported future versions, malformed data, or invalid references without changing the current game. Do not silently discard unknown species from an incompatible save.
- Detect storage errors. Keep the session usable, clearly mark unsaved progress, and offer export; never claim a failed write succeeded. After a successful write, show a quiet saved indicator.
- Request persistence when supported and inspect the result. A denial must not block play. Browser storage policy does not replace backups. [WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/)

Persist an active encounter's selected fish, random-generator state, remaining active wait, fight state, and pending disposition. Hidden time advances no active timers. On resume, re-read real-world time for new casts and passive systems, clear held input, and wait for an explicit Resume tap. An interrupted cast can also be cancelled without losing additional resources.

### Updates, offline use, and iPhone acceptance

Prepare a web manifest, icons, standalone display, and a service worker that caches the shell and current prototype assets. After one successful online load, M0 must launch and fish offline. Later regions cache on visit; show an honest unavailable-offline message for never-downloaded regions.

Keep app versions and save versions separate. Stage an available update and activate/reload at an idle point after saving; never force reload during a fight or pending reveal. Cache deletion must not erase IndexedDB. Test an actual version A to B update and a save migration fixture. A restart test alone does not prove update compatibility or long-term storage persistence.

Use a stable hosting path and project-specific storage/cache names. Configure Vite's base path, manifest URLs, asset paths, and service worker scope for the actual GitHub Pages repository path. A personal-use audience is not an authentication feature; do not claim a plain static deployment is private. This planning revision creates no repository or deployment. [Vite GitHub Pages guide](https://vite.dev/guide/static-deploy.html#github-pages)

For Andy's iPhone 16 Pro Max:

- Test the installed Home Screen app as well as Safari. Record iOS and app versions in the playtest result.
- Respect safe areas and dynamic viewport changes. Keep readable controls around 44 CSS pixels or larger. Avoid crucial interactions at screen edges.
- Disable unwanted selection/gestures only on the game surface. Menus must remain scrollable, readable, and keyboard-accessible where relevant.
- Unlock audio on user interaction, pause it when hidden, and provide mute/reduced-motion controls. Andy wants fishing haptics. Safari/Home Screen web apps on iPhone do not provide general vibration control; reliable bite, hook, tension, and landing feedback needs a native app wrapper. Defer that platform decision and implementation; do not add a nonfunctional haptics toggle or depend on undocumented switch-control tricks. Audio and visual cues remain sufficient for play.
- Target a stable 60 fps during fishing, with a capped rendering resolution if needed. Do not assume the display's maximum refresh rate is the game target.
- Prefer WebP final art, region-based loading, and roughly under 15 MB per region. Placeholders should keep M0 much smaller.

Automated checks can verify rules and browser behaviour. Andy's physical-device feel/performance test is a separate acceptance gate; mark it pending until performed.

## 11. Content and state contracts

Adding species, recipes, or a location using existing mechanics should require validated content and art only. Adding a new interaction can require code. Preserve stable IDs across save migrations; keep balancing values in one owner location rather than duplicating numbers across files.

| Record | Required information |
| --- | --- |
| Species | Stable ID, names, kind, measurement, supported length range, fixed baseline size distribution, optional length-weight parameters, fight behaviour, original descriptive facts, side-profile and swimming asset IDs, biological sources. |
| Occurrence | Species and location IDs, zones, location-relative rarity, four phase modifiers, 12 month modifiers, compatible methods, bait/lure affinities, hard access requirements, regional retention policy, confidence, sources, deliberate design departures. Sight targeting is an encounter mode, not a bait type. |
| Location | Region, spot/port kind, habitat, coordinates/time zone when geographically timed, explicit clock policy, zones, unlock conditions, scene geometry/hotspots, junk tables. |
| Item and recipe | Stable IDs, item category, stack/instance rules, bait eligibility, known/unlock condition, retained tools, exact consumed quantities, exact outputs, and source of every required input. |
| Encounter | Unique ID, target or random origin, committed fish/junk identity, size, time context, random state, active phase/timers, fight state, and resolution status. |
| Catch and knowledge | Immutable catch/sighting IDs, observed conditions and identity confidence, personal records, rumour evidence and sources; inventory retention/disposition stored separately. |
| Quest and rumour | Typed requirements/effects, required versus optional status, repeatability, prerequisite availability, supported clue facts, and completion/reward IDs. |
| Legendary | Named individual, species, fixed size, spawn conditions, clue sources, recorded-once flag, and display rules independent of physical retention. |
| Save envelope | App/schema/content versions, UTC timestamp, state payload, persistent random state, and valid recovery generation. |

Use separate schemas for prototype test fish, catchable researched creatures, and sighting-only animals. Sighting-only animals must not require fabricated fight stats or length-weight relations. Geographic conservation status and location-specific game rules are distinct fields.

When moving from M0 to M1a, migrate synthetic catches into a clearly labelled prototype-history archive and retain settings. Begin the actual island with its defined starting inventory. Never relabel a synthetic test catch as a real species or count it toward the researched collection. Explain that transition once and preserve the ability to export the prior prototype save.

Each biological source reference records title, URL, access date, supported fields, and any applicable attribution/reuse notes. Pure game-balance values are design decisions, not biological claims. Confidence accompanies uncertainty rather than converting weak evidence into exact seasonal prohibitions.

Store global timing thresholds, rarity weights, progression targets, prices, equipment stats, and size-bias parameters in a documented balance configuration. Store per-species facts in species records and regional ecology in occurrences. Avoid duplicating a price or threshold in both item data and balance data.

Before each implementation increment, define only its concrete schemas and validate its content. Before M1a, this includes items, recipes, and inventory; before M1b, it includes the full mandatory escape dependency graph; before M2, commerce and quests. Full future schemas are not prerequisites for M0.

## 12. Research workstream

Research the next playable increment, not the whole world in advance. M0 uses fictional, visibly labelled test profiles. Before M1a, research about six appropriate island fish; before M1b, expand to roughly eight to ten and prove the escape route. M1c can expand toward fourteen fish, five other creatures, and three sighting species. Counts are content budgets, not quotas that justify inaccurate choices.

For a new region:

1. Select an anchor area, geographic clock, and three to five habitats supported by reliable regional sources.
2. Build a candidate list appropriate to the milestone. A mature region may eventually contain 25–35 fish, 5–8 other creatures, and 2–4 sighting species; the first port is smaller.
3. Verify precise species identity, habitat, methods, typical sizes, seasonal patterns, activity periods, and applicable collection/retention policy. Track evidence per field group.
4. Select a useful mix of ordinary and unusual discoveries. Do not force three species into every method, a seasonal quota, or release-only quotas if the ecology does not support them.
5. Write original descriptions and truthful rumours. Preserve uncertainty; a missing observation is not proof of absence.
6. Review every rare/epic record and a sample of at least 30 percent of the remainder in a separate verification pass. Resolve conflicts or explicitly mark confidence before shipping.
7. Run content validation and encounter simulations across rigs, all four phases, and all 12 months. Verify main progression reachability with the actual recipes and inventories, not only catch percentages.

| Source type | Best use |
| --- | --- |
| Relevant government fisheries and conservation agencies | Regional occurrence, run timing, protection and access rules |
| FishBase and SeaLifeBase | Taxonomy, habitat, measurement, length-weight research |
| IUCN | Conservation status, kept separate from local game retention policy |
| IGFA or other documented record sources | Carefully qualified record-size comparisons |
| iNaturalist and GBIF | Supporting occurrence evidence, with observation/sampling bias recognised |
| Regional guides and charter reports | Practical bait and activity clues, with explicit confidence |

Record attribution and asset/data reuse terms with sources; do not assume facts, copied descriptions, photos, and database extracts all have the same reuse terms. Write descriptive prose from scratch and use owned/generated/appropriately licensed art. Preserve this provenance for the personal prototype so a possible future public release can be assessed without reconstructing it.

Rarity represents encounter frequency in the chosen habitat. Start unknown phase modifiers at neutral values, then adjust only with evidence. A zero is a strong absence claim. Monthly changes should reflect migration or ecology rather than a generic Northern Hemisphere season template. For length-weight parameters, check length convention, units, sex/population applicability, and supported size range. A discrepancy at record size calls for review; do not select parameters solely to make the largest length match a separate weight record.

Deliver `research/<region>/dossier.md`, a source register, and validated content for that increment. Keep research questions and deliberate simplifications visible in the dossier.

**Island candidates requiring verification:** sergeant major, bluehead wrasse, French grunt, yellowtail snapper, schoolmaster, bar jack, houndfish, squirrelfish, bonefish, permit, great barracuda, mutton snapper, and tarpon; spiny lobster, common octopus, ghost crab, and queen conch; green turtle, southern stingray, and bottlenose dolphin as possible sightings. These are an incomplete seed list, not an assertion of catchability, regional legal status, or final content. Resolve ambiguous common names to scientific identities. Select the always-available progression pool from verified suitable candidates rather than altering the ecology of a seasonal species.

## 13. Art and audio workstream

The game must remain playable with placeholders. Final art follows a chosen style, with identifiable anatomy and a consistent regional palette. A style decision is not required to implement M0.

During prototyping, compare the same Rocky Point scene, bonefish specimen, and stone knife icon in three styles: bold-outline cartoon, gouache storybook, and simplified field-guide watercolour. Andy chooses a direction. Record a short style guide and selected references before producing full batches. Art generation is a separate requested work item; a build brief does not require generating a whole asset library.

| Asset | Initial specification |
| --- | --- |
| Scene | Portrait master around 1290 × 2796, converted to WebP. Castable water in lower 55–60 percent; no baked-in controls or text. Adapt crop and hotspots to the actual viewport. |
| Field-guide specimen | Transparent 1536 × 1024, side profile facing left, readable anatomy. |
| Swimming silhouette | Separate simplified top/oblique view matching the scene perspective. Species proportions and visible field marks remain identifiable where practical. Do not derive it blindly from the side-profile specimen. |
| Item/material icon | Transparent 512 × 512, centred, consistent three-quarter view. |
| NPC portrait | 1024 × 1024 bust, added with the relevant NPC. |
| Interface and app icon | Small consistent UI set and 1024 × 1024 icon master; UI text rendered by the game. |

Keep outline treatment, lighting, and colour language consistent. Water, line, float, and ripples can be drawn in code over scene polygons. Tint neutral backgrounds for phases, with separate night art only if needed for readability. Night should remain legible at the starter shore.

The eventual asset manifest maps stable IDs to files and labelled fallbacks. A later prompt-sheet tool can combine the style guide with species visual notes; an ingest tool can check size/transparency, trim, convert, and update the manifest. These tools are not M0 requirements.

Check species art against two or three suitable references for anatomy, fin placement, tail, mouth, and markings. Check both specimen and swimming views. Do not use attractive but misleading species images.

M0 needs only simple generated/code-based feedback sounds and a mute option. Add licensed or original habitat ambience and a modest sound library after the fishing interaction works. Record audio attribution with the asset manifest. Audio polish must not delay the first phone test.

## 14. Build plan and acceptance

Work in small, testable increments. An increment can span several work sessions. Stop at each player-facing gate for a playtest; do not proceed to the next milestone merely because implementation time remains.

| Milestone | Scope | Acceptance |
| --- | --- | --- |
| M0 Fishing prototype | One Rocky Point scene, three test fish, bait-and-wait, cast/hold/release/reveal, hook assist, modest debug controls, save/recovery/export/import, offline installation and update handling. | Repeatable rule checks and browser checks pass. Andy can install and play on iPhone 16 Pro Max, resume interruptions, restore a save, and confirm casting/fighting feel good. See BUILD_M0.md. |
| M1a Small island loop | About six researched fish, starter fishing plus minimal gathering/crafting overlays, basic catch bag/storage, a few exact recipes, one useful crafted upgrade, simple observation cards. | An upgrade takes about 10–20 minutes; every phase/month and empty-bait/full-bag scenario has a path forward. Research/content validate. |
| M1b Island escape | Required island scenes, eight to ten fish as needed, complete mandatory recipes, provisions, guaranteed bearing, raft and ending card. | A fresh save can escape in roughly 45–90 active minutes at any start hour/month without a daily wait or essential random-drop stall. Save transactions and recipe dependencies pass checks. |
| M2 First port | One port, one new fishing spot, coins, shop gear/basic reel, one NPC with a short clue-led chain, skiff/travel map, destination clock, island revisit. | Selling and upgrading open meaningful new water. First shop rod is achievable in about 20–40 minutes including quests. Destination phases use actual coordinates/time zone. |
| M1c Optional island depth | Lure retrieve, sight casting, additional optional island species, torch coves, woven trap, expanded journal. | Each method preserves the relevant fish identity and adds a worthwhile discovery. Nothing retroactively gates escape. Normally scheduled after the first-port test. |
| M2b Caribbean expansion | Additional spots toward four total, more NPC chains, rumours, orders, expanded equipment/passive methods. | Each rare/epic target has at least two obtainable clues. Economy remains viable without daily orders or rare drops. |
| M3a Amazon | One additional region, its regional equipment and researched flood mechanic. | Existing systems accept new content; any new mechanic has an explicit small implementation and relevant checks. |
| M3b Alaska | Seasonal region, appropriate nets/pots, larger boats, fish finder as justified by content. | Seasonal goals are optional and meaningful fishing remains available year-round. |
| M4 Regional depth | Great Barrier Reef, legendaries, moon/stylised tide/weather, biologist and research release. | Clues explain each legendary; basic regional completion does not require it. Research retention rules and generated-condition disclosures are consistent. |
| M5 Collection displays | Museum, aquarium, trophy wall, optional badges and audio polish. | Retained, released, and sighting-only records all satisfy their intended display paths, without a legendary clue dependency cycle. |

M1c is an optional feature milestone, not a prerequisite for reaching M2. Scope later content only when the prior loop is enjoyable. Research runs one increment ahead; final art can follow placeholders. No milestone promises a release cadence or requires a separate agent.

Use meaningful tests for implemented rules and known failure paths: deterministic encounters, pause/resume, catch disposition, saves/migrations, crafting consumption, and progression reachability. Do not require tests for every line or a simulator for systems that do not exist yet. Summaries distinguish automated evidence, browser evidence, and pending physical-device observations.

## 15. Later decisions and first handoff

No product decision remains that blocks M0. Implement the approved defaults and use the phone playtest to resolve feel and timing.

Deferred choices are the final name, final art direction, researched species/region details, and later equipment prices. Revisit them at the milestone that needs them. The current defaults are one successful record per legendary, real regions with fictional ports, and release benefits of preserved discovery credit and free inventory space before research rewards arrive.

Before actual phone deployment, choose the GitHub repository/hosting destination and record the installed iOS version. These operational details do not block local implementation. Prepare a deployment-ready build first; deployment occurs as part of the separately requested build/testing work, using the chosen destination.

Read [BUILD_M0.md](BUILD_M0.md) for the first implementation scope and acceptance checklist. At M0's end, report what works, what was tested, what remains for Andy to try, and any material deviations. Stop for the phone playtest before adding island systems.
