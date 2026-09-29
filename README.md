# Sol / Luna website demo

An English-only, responsive corporate homepage with grouped navigation, the extracted OpenAI Sol / Luna WebGL scene, research directions, principles, journal notes, and a directory footer. The five required scene modules are vendored locally; no package installation or frontend build step is required.

## Preview

Serve over HTTP (ES modules do not support opening this page directly with `file://`). Run:

```sh
docker build -t sol-luna-www .
docker run --rm -p 8080:80 sol-luna-www
```

Visit http://localhost:8080. Health endpoint: `/health`.

## Dokploy

No existing Dokploy project configuration was supplied. These are standard Dockerfile application settings, not a verified match for an existing deployment.

1. Create an **Application** and connect the Git repository and branch.
2. Select **Dockerfile** as the build type.
3. Set build context to `.` and Dockerfile path to `Dockerfile`.
4. Deploy. The container listens on **80**; no environment variables, volumes, or frontend build command are required.
5. In **Domains**, add your `www` hostname with path `/` and container port **80**. Enable HTTPS through Dokploy's certificate settings.
6. Point the hostname's DNS at the Dokploy server. Do not publish a separate host port 80/443 for this application; let Dokploy's reverse proxy handle ingress.
7. Check `/health` and the homepage after deployment. Configure an apex-to-www redirect in your platform if needed.

For reproducible production releases, pin the Nginx image to a reviewed version/digest rather than the moving `stable-alpine` tag.

## Files

- `index.html`: English copy, semantic sections, desktop/mobile navigation.
- `style.css`: warm editorial layout and responsive styling.
- `main.js`: navigation and WebGL scene adapter; pause, replay, drag rotation, reduced-motion preference, offscreen/background suspension.
- `assets/official-scene.js`: five extracted modules containing Three.js, WebGL renderer, postprocessing, SVGLoader, and the source scene. No external asset requests are required.
- `constellation.js` / `constellation.css`: A WINDOW INTO MORE star map with 14 lab/platform nodes; clicking a node updates the detail panel and the "Stay curious" destination.
- `assets/cloud-mesh.js`: 44 extracted Turbopack modules implementing OpenAI's `monochrome-murmuration` particle effect (React + React Three Fiber + Three.js) from the Hugging Face incident article; loaded through a custom Turbopack module loader with CJS interop. No external requests.
- `nginx.conf`: static serving, real 404s, health check.
- `Dockerfile`: Nginx container for Dokploy.

## Animation provenance and launch checklist

The animation now uses the **actual public scene implementation** retrieved from OpenAI's Sol / Luna page through a headed Chrome session. The original scene shaders, embedded paths, and rendering logic are retained. Its surrounding React component and GPU detection are replaced by our adapter and explicit quality profile; layout and quality can therefore differ from the original page. See `reference/README.md` for source module mapping.

This is a local integration demo, not a grant of rights to republish OpenAI's artwork or code. Third-party scene code is now included in the Docker image. Obtain appropriate permission and preserve applicable third-party notices before deploying publicly.

Browser checks: desktop 1440×1100 and mobile 390×844 reached scene `ready`, with no JavaScript errors or horizontal overflow; pause and mobile menu responded; the local page made no external HTTP requests during the clean verification run. Initial shader compilation can take several seconds.

Navigation grouping is informed by Anthropic's public site, not copied branding. Sol / Luna is placeholder branding, and all product/research text describes a design concept rather than released products or actual research results.

Before public launch: replace the placeholder brand and copy; add genuine product/documentation/contact destinations and any necessary legal pages; verify mobile and keyboard interaction; secure permission before incorporating third-party animation resources. Current directory links navigate to homepage sections, not separate routes.
