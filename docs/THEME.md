# DREAMengin Theme

> **Documentation Owner:** José Mancilla (appthemanger-ctrl)  
> **Documentation Date:** 2026-04-06


Status: active design implementation note  
Last updated: 2026-03-06

`README.md` is the product authority. This file records the design language that the repo should use while aligning to that spec.

## Core palette intent

- **Gold** = action, save, confirm, premium emphasis
- **Light Blue** = connected state, live state, signal state
- **White** = base surface, clarity, breathing room

## Product feel

DREAMengin should feel:
- premium
- mobile-first
- clear
- intentional
- privacy-first

It should not feel:
- noisy
- gamey by default
- cluttered
- dark just for drama

## Surface language

### HomeDream
Gold should anchor the persistent navigation and other high-authority actions.

### EditProfileDream
Gold should signal unsaved-change save actions, publish/confirm moments, and explicit visibility changes.

### ViewProfile
Light blue and white should carry most of the public/shared presentation, with gold used sparingly for owner-authority cues.

## Motion rules

- motion should be intentional
- motion should help orientation
- motion should not consume battery for decoration alone
- visually rich surfaces still need restraint

## Repo implementation note

Theme implementation material currently lives across:
- `app/globals.css`
- `app/globals-enhanced.css`
- `styles/theme.css`
- `components/ThemeApplicator.tsx`
- `components/providers/ThemeProvider.tsx`

## Alignment rule

When theme docs or code mention older sky/frosted-glass language, keep what is useful, but prioritize the README palette and behavior model.
