# Prompt Hunter (Frontend Only)

Mobile-first, retro pixel, Canvas 2D game built with React + TypeScript + Vite and Tailwind v3. No backend required.

## Overview
- Uses a JSON content pack to drive roles, phases, and validators
- Real-time combat loop: monster attacks on a timer, you answer prompts to deal damage
- Safe validation: any js_eval runs inside a Web Worker sandbox with 500ms timeout
- Optional Gemini chat helper (frontend-only) with token usage tracking

## Tech
- React + TypeScript (Vite)
- Tailwind CSS v3
- Zustand for state
- react-router-dom for routing
- Canvas 2D, pixelated rendering with DPR-aware integer scaling

## Run
```bash
npm i
npm run dev
```
Open the local URL printed by Vite.

## Content Pack
- Default pack is loaded from `public/content/ai_monster_pack_v2_extended_roles.json`
- Replace at runtime in the Settings/Menu page via file picker (JSON schema validated lightly)

## Gameplay
- Player HP defaults to 100. Monster attacks every 5s by default
- Correct answers deal damage; clearing 5 phases marks the role as WIN
- If Player HP reaches 0, you are returned to the menu with a toast

## Gemini API (Optional)
- Enter an API key in the Chat panel or Settings
- Restrict this key to HTTP referrers in Google AI Studio for safer frontend usage
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent` (POST)
- No key? Use Copy Context and the Open Gemini link

## Security
- No eval on the main thread
- Worker sandbox disables DOM, network, and importScripts; 500ms timeout; returns boolean only
- API key stored only in sessionStorage

## Screenshots
- Menu: character grid with WIN overlays
- Play: canvas + HUD, player/monster HP, task/answer/chat panels

## License
MIT
