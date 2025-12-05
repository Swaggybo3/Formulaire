# FiveM Discord Bot

## Overview
This is a Discord bot that displays the status of a FiveM server directly in a Discord channel. The bot automatically updates server information (connected players, ping, status) every minute.

## Project Structure
- `index.js` - Main bot entry point
- `package.json` - Node.js dependencies (discord.js, node-fetch)
- `README.md` - Project documentation (French)

## Technologies
- **Runtime**: Node.js 20
- **Framework**: discord.js v14
- **HTTP Client**: node-fetch v2.6.7

## Setup Instructions

### Required Environment Variables
You need to configure the following secrets in Replit:

1. **DISCORD_BOT_TOKEN** (required) - Your Discord bot token
   - Get it from the Discord Developer Portal
   - Create a bot at: https://discord.com/developers/applications

2. **DISCORD_CHANNEL_ID** (optional) - The Discord channel ID where the bot will post status updates
   - Default: 1378391341771264020

3. **FIVEM_SERVER_ADDRESS** (optional) - Your FiveM server address (IP:PORT)
   - Default: 213.32.43.207:33161

### Bot Permissions
Your Discord bot needs:
- Guild intents
- Guild Messages intent
- Permissions to read and send messages in the target channel

## How It Works
1. Bot connects to Discord using the provided token
2. Fetches the configured Discord channel
3. Sends an initial embed with server status
4. Updates the embed every 60 seconds with live data from the FiveM server
5. Displays: player count, ping, and server status

## Running the Bot
The bot runs automatically via the configured workflow. It will:
- Connect to Discord
- Monitor the FiveM server
- Update status every minute

## Recent Changes
- 2025-11-05: Initial Replit setup
  - Moved hardcoded credentials to environment variables
  - Set up Node.js workflow
  - Added security improvements (no hardcoded tokens)
