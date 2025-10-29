# Anime Character Recognizer (frontend)

This repository contains the Vite + React + TypeScript frontend for Anime Character Recognizer — a web UI to upload and recognize anime characters (uses Supabase for storage/DB and a backend or ML service for recognition).

## Stack
- Vite + React (TypeScript)
- TailwindCSS (shadcn component style)
- Supabase client (@supabase/supabase-js)
- React Query (@tanstack/react-query)

## Getting started

1. Install dependencies
   - npm: `npm install`
   - yarn: `yarn`
   - pnpm: `pnpm install`

2. Environment variables
   - Create a `.env` file (do NOT commit it). See `.env.example` for keys needed.
   - Important: if you accidentally committed credentials, rotate them immediately (Supabase dashboard).

3. Run dev server
   - `npm run dev` (or `pnpm dev` / `yarn dev`)
   - Open http://localhost:8080

4. Build
   - `npm run build`

## Contributing
- Add components under `src/components`.
- Pages go in `src/pages`.
- Lint with `npm run lint` (ensure ESLint config is valid)

## Security
- Do not commit `.env`. If keys are leaked, rotate them in your Supabase project now.

## Contact
Created by Prakash Waddar.