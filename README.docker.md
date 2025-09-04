Quick: Run the exported static site in Docker

Prerequisites:
- Docker (or Docker Desktop) installed locally
- The project `out/` directory must contain the static export (e.g. `next export` output)

Build image:

```bash
docker build -t movie_app_static .
```

Run container (port 8080 on host):

```bash
docker run --rm -p 8080:80 movie_app_static
```

Or with docker compose:

```bash
docker compose up --build
```

Notes:
- The Dockerfile copies the `out/` directory into the nginx image. If you prefer live-mounting during development, enable the volume line in `docker-compose.yml`.
- The nginx config includes a SPA fallback (serves `index.html` for unknown routes).
- If `out/` is empty, run `next build && next export` from the project root to populate it before building the image.
