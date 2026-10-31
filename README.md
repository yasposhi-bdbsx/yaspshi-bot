# NSFW Guard Bot

Scans images posted in your server with a local NSFW model and deletes explicit ones.
No external API keys needed, only the Discord bot token.

## Setup
1. Requires Node.js 18 to 20 (TensorFlow native build).
2. `npm install`
3. Put your bot token in `.env` (`DISCORD_TOKEN=...`).
4. In the Discord developer portal, enable **Message Content Intent** for the bot.
5. Give the bot **Manage Messages** permission in the channels to guard.
6. `npm start`. The first start downloads the model, so wait for "NSFW guard is running."

## Limits
- Images only (png, jpg, webp). GIFs and videos are not scanned.
- Gore detection is not included. A reliable gore model needs a paid or cloud API.
- No model is perfect. Raise THRESHOLD to reduce false positives, lower it to catch more.
