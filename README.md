# Garmin Connect MCP Server

Local TypeScript MCP server that exposes Garmin Connect activity data as tools.

## Features

- `get_recent_activities`: List recent activities with optional activity type filter.
- `get_activity_detail`: Get full details for a specific activity ID.
- `get_daily_metrics`: Get daily steps, heart rate, and sleep data.
- HTTP MCP endpoint on `/mcp` for ChatGPT web developer mode.
- Local tunnel support via `localtunnel`.

## Requirements

- Node.js 20+
- A Garmin Connect account

## macOS Installation (Step by Step)

1. Install Homebrew (if not installed):

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Install Node.js and npm with Homebrew:

```bash
brew install node
```

3. Verify installation:

```bash
node -v
npm -v
```

4. Clone and enter the project:

```bash
git clone https://github.com/artuguen28/garmin-connect-mcp.git
cd garmin-connect-mcp
```

5. Install project dependencies:

```bash
npm install
```

6. Create your environment file:

```bash
cp .env.example .env
```

7. Edit `.env` with your Garmin credentials, then start:

```bash
npm run dev:cloudflare
```

8. Copy the `Your ChatGPT MCP URL: https://.../mcp` line shown in terminal and paste it in ChatGPT.

9. If you want detailed cloudflared logs, set in `.env`:

```env
SHOW_CLOUDFLARED_LOGS=true
```

10. Optional logging controls in `.env`:

```env
SHOW_CLOUDFLARED_LOGS=false
CLOUDFLARE_LOGLEVEL=info
CLOUDFLARE_TRANSPORT_LOGLEVEL=error
```

11. Manual URL format (if needed):

`https://...trycloudflare.com/mcp`

in ChatGPT MCP connector Server URL.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Fill in Garmin credentials in `.env`:

```env
GARMIN_USERNAME=your.email@example.com
GARMIN_PASSWORD=your_password
PORT=3000
```

## Run Locally

Development mode:

```bash
npm run dev
```

One-shot run:

```bash
npm start
```

Build check:

```bash
npm run build
```

Health endpoint:

`http://localhost:3000/health`

MCP endpoint:

`http://localhost:3000/mcp`

## Expose with Local Tunnel

Start the server first, then in another terminal run:

```bash
npm run tunnel
```

This prints a public URL like:

`https://some-name.loca.lt`

Your MCP URL for ChatGPT developer mode is:

`https://some-name.loca.lt/mcp`

## Connect in ChatGPT Web (Developer Mode)

1. Open ChatGPT settings and go to developer tools/integrations.
2. Add a new MCP server.
3. Choose HTTP transport.
4. Use the localtunnel URL ending in `/mcp`.
5. Keep authentication set to none for the MCP endpoint.

## Cloudflare Tunnel (Recommended)

Install cloudflared (macOS):

```bash
brew install cloudflared
```

Run MCP server and Cloudflare tunnel in one command:

```bash
npm run dev:cloudflare
```

The command prints a URL like:

`https://<random>.trycloudflare.com`

The script now prints a user-friendly line in this format:

`Your ChatGPT MCP URL: https://<random>.trycloudflare.com/mcp`

Use that exact URL as your ChatGPT server URL.

If you prefer raw cloudflared logs, set this in `.env`:

```env
SHOW_CLOUDFLARED_LOGS=true
```

Manual URL format:

`https://<random>.trycloudflare.com/mcp`

If the URL changes, update the connector URL in ChatGPT.

## Notes

- Garmin Connect data itself still requires Garmin account login.
- This project uses your local Garmin credentials from `.env` on startup.
- No additional authentication is required between ChatGPT and this MCP endpoint.