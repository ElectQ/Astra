# Third-party reference — not deployed

Source page: https://openai.com/index/introducing-gpt-6-sol-and-luna/

Downloaded public social preview image:
https://images.ctfassets.net/kftzwdyauwt9/7fvmMcBIvMTXxVJh7NEMt1/48a75e624699bb1e218366c1d3522048/gpt-6-sol-luna-seo.png?w=1600&h=900&fit=fill

`openai-sol-luna-seo.png` is a third-party reference, not our artwork. No license or commercial reuse permission was established. It is excluded from the Docker build and is not displayed by the demo.

Retrieval status:
- Page body and rendered HTML obtained through Jina Reader.
- HTML contains `data-updates-scene="ready"` and a canvas marked `three.js r180`.
- Direct public JS requests returned HTTP 403, including the www redirect and a request without the configured proxy.
- Jina Reader rejected the JS response with HTTP 422 (unsupported application/javascript content type).
- A clean headless Chrome session reached the waiting/challenge page, not the scene.
- The downloaded PNG is only a static social preview. The original animation, shaders, and scene dependencies remain unavailable.

A subsequent rendered-page fetch returned `data-updates-scene="fallback"`. Its actual scene fallback image was downloaded as `openai-scene-fallback.webp` from:
https://images.ctfassets.net/kftzwdyauwt9/Zxpz4Yov4StpjdTz9Vd7e/349311d731fd8637fbf4e20115644c02/videoframe_0.png?w=1920&q=90&fm=webp

This is a static starfield fallback, not the animation. `script-urls.txt` records the public script URLs from that response; identifying the scene module still requires retrieving their contents. No MP4/WebM/HLS URL was found in that HTML. Direct script retry still returned HTTP 403.

## Successful headed-browser retrieval and integration

The subsequent headed Chrome session, using the same local proxy, returned HTTP 200 and `data-updates-scene="ready"`. It captured 109 script files. The earlier failed attempts above are historical, not the current retrieval status.

The scene component in `42q__82n2c1qo.js` dynamically loads module 914469 (`createUpdatesRenderer`) from `1m721ga1vu-xc.js`, along with `3v8c94bcjj6rm.js`.

Five necessary modules were extracted into `assets/official-scene.js` without executing unrelated website modules:

| Module | Source chunk | Role |
| --- | --- | --- |
| 914469 | 1m721ga1vu-xc.js | Original scene, shaders, embedded SVG paths |
| 63295 | 3v8c94bcjj6rm.js | SVGLoader |
| 695418 | 0dfpqjin6t4po.js | Three.js core |
| 361489 | 1a43l2lhrwu30.js | WebGL renderer |
| 409703 | 1zh-4axgz_vnu.js | Postprocessing |

Source URL prefix: `https://openai.com/_next/static/immutable/chunks/`.

A small local module adapter replaces Turbopack registration; the five factory bodies are unchanged. `main.js` supplies sizing, a quality profile, playback, visibility, and pointer controls. The React wrapper, website analytics, login, and GPU detection service are not included.

The previous procedural Canvas approximation was removed. Desktop/mobile browser verification reached `ready`, returned no JS errors, and made no external HTTP requests in the clean run. The original source implementation is now integrated, but this does not establish commercial reuse rights or pixel-identical output across different viewport/quality settings.
