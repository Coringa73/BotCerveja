# BotCerveja

## Overview
Multi-functional Discord bot with automated messaging and music playback capabilities:
- Sends confirmation message when it comes online
- Daily scheduled message at 09:00 Lisbon time with the current date
- YouTube music player with queue management for voice channels

## Features
### Automated Messaging
- Daily notification at 09:00 Lisbon time with formatted date
- Startup confirmation message

### Music Player Commands
- `-p [YouTube URL]` - Add a song to the queue and play
- `-pause` - Pause current playback
- `-resume` - Resume playback
- `-stop` - Stop music and clear queue
- `-queue` - Display current queue

### Auto-Disconnect
- Bot automatically disconnects from voice channel after 20 minutes of inactivity

## Project Structure
- `bot.js` - Main bot file with Discord.js client, cron scheduler, and music player
- `package.json` - Node.js dependencies

## Required Environment Variables
- `TOKEN` - Discord bot token (from Discord Developer Portal)
- `CHANNEL_ID` - Discord channel ID where text messages will be sent

## Required Discord Permissions
In Discord Developer Portal, enable these privileged intents:
- **Message Content Intent** (Required for command processing)
- Server Members Intent (Optional)
- Presence Intent (Optional)

## Tech Stack
- Node.js 20
- discord.js v14.24.2
- @discordjs/voice for audio playback
- ytdl-core for YouTube streaming
- node-cron v4.2.1 for scheduled tasks
- FFmpeg for audio processing

## System Dependencies
- FFmpeg (installed via Nix for audio processing)

## Recent Changes
- 2025-11-03: Installed FFmpeg for audio processing support
- 2025-11-03: Updated event listener to 'clientReady' for discord.js v15 compatibility
- 2025-11-03: Initial Replit environment setup with Node.js 20
- 2025-11-03: Configured workflow for continuous bot operation
