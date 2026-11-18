# Request: Money tiles overflow on phones (MG-23)
From: OWNER · To: MANAGER · Priority: P2 · Status: OPEN

Found while testing the live preview (https://exceptionalappstudios-ship-it.github.io/bewise_system/preview/manager/#money).
At 360–390 px wide, the three tiles under "To collect" (`grid grid-cols-3`, amounts at `text-[30px]`) are too narrow:
"₹1,000" spills out of its tile and "₹2,394" is cut off at the screen edge (tile 328 px content vs 341 px needed).

Suggested fix: scale the amount with the space, e.g. `text-[clamp(20px,6vw,30px)]`, or stack the tiles as 1 + 2 below ~420 px,
and add `min-w-0` on the tiles. Please also check the To pay / Expenses tabs, which use the same tiles.
Then rebuild the Pages preview: `bash preview/build.sh` (commit only `preview/manager`).
