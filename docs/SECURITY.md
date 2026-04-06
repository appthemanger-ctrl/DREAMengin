# DREAMengin Security and Privacy

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


Status: active implementation guide  
Last updated: 2026-03-06

DREAMengin is privacy-first. `README.md` is the authority for product rules.

## Non-negotiable rules

- nothing is public by default
- all creation starts private
- no hidden sharing
- no fake actions
- no system may bypass privacy rules

## Repo security model

- Next.js App Router server boundaries
- Supabase Auth for authentication
- Supabase Postgres with RLS for protected data
- server-side API routes for sensitive operations
- environment variables for secret server-side provider keys

## Surface boundaries

### HomeDream
Private by default. Source Dreams and live private state belong here.

### EditProfileDream
Private builder surface. Changes here should not become public/shared until explicitly saved.

### ViewProfile
Shared/public output surface. It should render only allowed saved output.

## AI triad guardrails

- Dr. Eams must not imply non-existent actions or bypass privacy intent.
- IDARi must remain admin-only.
- TheBoogieMan.Ai must remain conservative and enforce boundaries.

## Current repo note

The repo contains both canonical and legacy naming. Security documentation should always interpret older route names through the newer spec boundary model rather than the other way around.
