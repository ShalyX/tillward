# Tillward pitch source

120-second, 1920×1080, 24 fps HyperFrames composition for Mezo Buildathon Wave 1.

The source uses the approved receipt-counter identity, fresh public product screenshots and labeled historical Mezo testnet proof. It does not simulate new chain writes. The receipt allocation scene is a mechanism illustration.

Narration is synthesized locally with Windows Microsoft Zira Desktop. Nine separate WAV clips sit on the timeline, with burned-in captions and a matching WebVTT file in the published release. No external voice service was used. Replace the WAV clips to re-record narration, retaining the scene timings or updating the composition attributes.

Node.js 22+ and FFmpeg are required. The CLI is pinned to HyperFrames 0.8.199 in package.json commands.

```sh
npm run check
npm run render -- --quality delivery --output renders/tillward-pitch.mp4
```

On Windows, if an incompatible cached browser causes `spawn EFTYPE`, point the session-only `HYPERFRAMES_BROWSER_PATH` variable at an installed Windows Chrome executable. This project was checked/rendered using Chrome and Intel hardware acceleration. The temporary setting does not modify the user's Chrome profile or global browser configuration.

`BRIEF.md`, `STORYBOARD.md`, `SCRIPT.md`, `frame.md` and `scenes.json` preserve the production decisions. `index.html` is the seekable composition. Assets are frozen local files. The original product code is at https://github.com/ShalyX/tillward and the public app is https://tillward.vercel.app .
