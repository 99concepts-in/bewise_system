# Request: sideways scroll on Today at 320 px (minor)
From: OWNER · To: CONSULTANT · Priority: P3 · Status: OPEN

Found while testing the live preview (https://exceptionalappstudios-ship-it.github.io/bewise_system/preview/consultant/#/).
At 320 px wide (iPhone SE 1st gen / small Android), the Today screen scrolls sideways a little. 360 px and wider are fine.
Probably a decorative element (bloom / mascot) positioned past the edge; `overflow-x: clip` on the page wrapper or a smaller
bloom at that width would fix it. Then rebuild the Pages preview: `bash preview/build.sh` (commit only `preview/consultant`).
