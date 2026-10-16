# ZID backlog

Each idea is written as a prompt you can paste into a new Claude Code session. All of them follow
`.claude/CLAUDE.md`. Ideas marked **ask first** need the owner's decision before any code.

## Daily challenge with a result card (**ask first**: needs server work)
> Plan a daily challenge for Sprej do Mostara: one fixed seed per day for everyone, a separate daily board and a
> shareable result card (1080×1350 image, made in the browser, nothing uploaded). The server code isn't in this
> repo, so start with a written proposal of the API changes for the owner, and touch no scoreboard code until
> it's approved.

## A new zone
> Propose a sixth zone for Sprej do Mostara (for example Jajce and the Pliva waterfall, or Počitelj), with its
> scenery, obstacles, walls you may and may not paint, and two or three sourced facts. Changing the zone count
> touches the scoreboard contract, so write the plan first and ask the owner before building.

## Seasonal events
> Add light seasonal touches that switch on by date with no server: snow on Trebević in winter, Sarajevo Film
> Festival lights in August, Ramadan/Bajram lanterns over Baščaršija. Cosmetic only (no scoring changes),
> bilingual, respectful, with reduced-motion fallbacks.

## Sticker collection and achievements
> Add a sticker book: players unlock stickers (the bandera set, the dictionary words, the zone landmarks) by
> playing, stored in localStorage only (no cookies, no account). Show it as a page of the bandera. Bilingual,
> keyboard accessible, no scoring changes.

## Play Store listing through a Trusted Web Activity
> Once Lighthouse PWA checks pass, prepare a Trusted Web Activity for the Play Store: assetlinks.json, icons,
> screenshots, store text in BS/EN. List what the owner must do in the Play Console. Ask before any account or
> payment step.

## Moderated public "wall of the week" (**ask first**: needs a moderation plan)
> Draft a plan for a weekly public wall where players submit their painted hero wall: how submissions are
> stored, how they're moderated before anything is public, how people can ask for removal, and what it costs.
> No code until the owner approves the moderation plan.

## A real screen-reader pass on phones
> Claude's cloud sessions have no screen reader, so Phase 3 was checked with axe, the accessibility tree and a
> keyboard-only run. Ask the owner (or a volunteer who uses one daily) to try VoiceOver on an iPhone and TalkBack
> on Android: paint the hero wall, start a run, lose a can, finish, switch to Bosnian. Note anything read twice,
> in the wrong language, or not at all, and fix those first.
