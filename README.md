# AI Productivity Blocker

A Chrome extension that uses Claude AI to decide whether a site is productive and blocks it if not.

## How it works

1. You navigate to a URL
2. The extension sends the domain to Claude (Haiku) — one word answer: `yes` or `no`
3. Productive sites load normally. Unproductive sites show a block page
4. Verdicts are cached permanently so each domain is only checked once

## Setup

1. Clone or download this repo
2. Open `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select the folder
3. Click the extension icon → enter your [Anthropic API key](https://console.anthropic.com/) → Save

## Features

- **AI classification** — Claude judges each new domain; no manual blocklist needed
- **Permanent cache** — domains are only ever checked once; view or remove entries from the popup
- **Strict mode** — lock the extension settings behind a password so you can't easily disable it

## Cost

Uses `claude-haiku-4-5` — roughly **$0.0001 per new domain**. Each domain is only checked once due to permanent caching.

## Permissions

| Permission | Why |
|---|---|
| `webNavigation` | Intercept page navigations |
| `tabs` | Redirect tabs to the checking/blocked page |
| `storage` | Store API key, verdicts cache, and strict mode state |
| `host_permissions: <all_urls>` | Required to intercept navigations on any site |
