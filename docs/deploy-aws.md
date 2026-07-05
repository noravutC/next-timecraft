# Deploying TimeCraft to AWS (EC2 + Docker)

Step-by-step guide for running the production Docker image on an AWS EC2
free-tier instance. Total time: ~30–45 minutes the first time.

> **Architecture**: one EC2 instance runs the Next.js container (built from the
> repo's `Dockerfile`). The database stays on **Supabase** (already free-tier)
> — we do NOT run Postgres on EC2, so the instance stays small and stateless.
> Pusher and Google OAuth are external SaaS, unchanged.

```
Browser ──HTTPS──> EC2 (Docker: Next.js standalone :3000)
                     │
                     ├──> Supabase Postgres (existing)
                     ├──> Pusher (realtime)
                     └──> Google OAuth / Anthropic / Gemini APIs
```

---

## Step 0 — Prerequisites

- [ ] AWS account (new accounts get free-tier credits)
- [ ] Your existing `.env.local` values at hand (Supabase URL, Pusher keys, Google OAuth, `NEXTAUTH_SECRET`)
- [ ] Repo pushed to GitHub (done)

## Step 1 — Launch an EC2 instance

1. AWS Console → **EC2 → Launch instance**
2. Name: `timecraft`
3. AMI: **Ubuntu Server 24.04 LTS (64-bit x86)**
4. Instance type: **t3.micro** (free tier)
5. Key pair: **Create new key pair** → `timecraft-key` → download the `.pem` file
6. Network settings → **Edit**:
   - Allow SSH (port 22) — *My IP* only
   - Allow HTTP (port 80) — Anywhere
   - Allow HTTPS (port 443) — Anywhere
   - (do **not** open 3000 to the world — Caddy will proxy to it)
7. Storage: 16 GiB gp3
8. **Launch instance** → note the **Public IPv4 address**

## Step 2 — Connect and install Docker

```bash
chmod 400 timecraft-key.pem
ssh -i timecraft-key.pem ubuntu@<PUBLIC_IP>
```

On the instance:

```bash
# Docker (official convenience script)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit   # log out and back in so the group applies
```

```bash
ssh -i timecraft-key.pem ubuntu@<PUBLIC_IP>
docker --version   # verify
```

## Step 3 — Get the code and configure env

```bash
git clone https://github.com/noravutC/next-timecraft.git
cd next-timecraft
nano .env.production   # paste the block below, fill real values
```

```env
DATABASE_URL=            # Supabase pooler connection string
NEXTAUTH_SECRET=         # same as local, or: openssl rand -base64 32
AUTH_URL=http://<PUBLIC_IP>   # switch to https://your-domain later
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
# optional
ANTHROPIC_API_KEY=
AI_ENCRYPTION_KEY=
```

## Step 4 — Build and run the container

```bash
docker build \
  --build-arg NEXT_PUBLIC_PUSHER_KEY=<your pusher key> \
  --build-arg NEXT_PUBLIC_PUSHER_CLUSTER=<your cluster> \
  -t timecraft .

docker run -d --name timecraft \
  --env-file .env.production \
  -p 127.0.0.1:3000:3000 \
  --restart unless-stopped \
  timecraft
```

Check it:

```bash
curl http://127.0.0.1:3000/api/health
# {"status":"ok","db":"up",...}
```

> `NEXT_PUBLIC_*` values are baked into the client bundle at **build** time —
> that's why they're `--build-arg`s, not runtime env. Changing them requires a
> rebuild.

## Step 5 — HTTPS reverse proxy with Caddy

Caddy terminates TLS and proxies to the container (auto-provisions Let's
Encrypt certificates when you have a domain).

```bash
sudo apt update && sudo apt install -y caddy
sudo nano /etc/caddy/Caddyfile
```

Without a domain (HTTP only, for now):

```
:80 {
    reverse_proxy 127.0.0.1:3000
}
```

With a domain (point an A record at the EC2 IP first):

```
your-domain.com {
    reverse_proxy 127.0.0.1:3000
}
```

```bash
sudo systemctl reload caddy
```

Visit `http://<PUBLIC_IP>` (or your domain) — the login page should load.

> **Google OAuth requires a real domain.** Google rejects bare IP addresses as
> authorized origins ("must end with a public top-level domain") and requires
> HTTPS for non-localhost domains. Point a domain's A record at the Elastic IP
> (a cheap registrar domain, or a free `duckdns.org` subdomain both work),
> put that domain in the Caddyfile, and Caddy provisions the certificate
> automatically. Guest login works without any of this.

## Step 6 — Update Google OAuth redirect

Google Cloud Console → APIs & Services → Credentials → your OAuth client:

- Authorized JavaScript origins: `http://<PUBLIC_IP>` (or `https://your-domain.com`)
- Authorized redirect URIs: `.../api/auth/callback/google`

Also update `AUTH_URL` in `.env.production` to match, then recreate the container (⚠️ `docker restart` does NOT reload `--env-file` — env is fixed at container creation):

```bash
docker stop timecraft && docker rm timecraft
docker run -d --name timecraft --env-file .env.production \
  -p 127.0.0.1:3000:3000 --restart unless-stopped timecraft
```

## Step 7 — Deploying updates

```bash
cd ~/next-timecraft
git pull
docker build --build-arg NEXT_PUBLIC_PUSHER_KEY=... --build-arg NEXT_PUBLIC_PUSHER_CLUSTER=... -t timecraft .
docker stop timecraft && docker rm timecraft
docker run -d --name timecraft --env-file .env.production \
  -p 127.0.0.1:3000:3000 --restart unless-stopped timecraft
```

(Automating this with a GitHub Actions deploy job + ECR is a good follow-up.)

## Step 7.5 — Battle-tested gotchas (hit during the real deploy)

- **`next build` OOMs on t3.micro** — Node caps its heap at ~half of RAM, so
  the TypeScript pass dies at ~455 MB even with free swap. Fixed in the
  Dockerfile with `NODE_OPTIONS=--max-old-space-size=2048` (+ a 2 GB swapfile
  on the host: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile &&
  sudo mkswap /swapfile && sudo swapon /swapfile`).
- **Allocate an Elastic IP before publishing any link** — the default public
  IP changes on every stop/start.
- **`AUTH_URL` must exactly match the public URL** (scheme included). If the
  Google callback shown at `/api/auth/providers` still points at an old
  IP/scheme, the container is running with a stale `AUTH_URL` — edit
  `.env.production`, then **stop + rm + run the container again**. A plain
  `docker restart` keeps the old env: `--env-file` is only read when the
  container is created.

## Step 8 — Operations checklist

- **Health**: `curl https://your-domain/api/health` — wire this into UptimeRobot (free)
- **Logs**: `docker logs -f timecraft`
- **Billing alarm**: AWS Console → Billing → Budgets → create a $1 budget alert
- **Stop when idle**: EC2 → Instance state → Stop (free tier hours are finite)

---

## Why these choices (interview talking points)

- **EC2 over App Runner/ECS**: shows raw Linux + Docker + reverse-proxy skills;
  App Runner abstracts exactly the parts worth demonstrating. Cost is also
  strictly free-tier-predictable.
- **Supabase stays as the DB**: databases on free-tier EC2 lose data on
  instance failure; the app container stays stateless and disposable.
- **Caddy over nginx**: automatic HTTPS in 3 lines of config.
- **Standalone output**: `next build` with `output: "standalone"` produces a
  self-contained `server.js` — the runtime image carries no `node_modules`
  from the build (image ≈ 200 MB vs ≈ 1.5 GB naive).
