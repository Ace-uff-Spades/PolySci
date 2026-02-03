# PolySci UI Refactor Design

**Date**: 2026-01-24  
**Purpose**: Refactor UI to avoid "AI slop" with distinctive, opinionated design  
**Status**: ✅ Completed

## Design Direction

**Aesthetic**: Modern Forum/Debate Hall
- Clean, structured, conversational
- Balanced visual weight
- Democratic, engaging atmosphere

**Color Palette**: Cool Balanced
- Slate blue: `#475569` to `#334155` (primary, headers, borders)
- Sage green: `#6B8E6F` (accents, highlights, success)
- Warm gray: `#F5F5F4` to `#78716C` (backgrounds, text)
- Amber: `#F59E0B` to `#D97706` (active states, important highlights)
- Neutral: White/off-white (content areas)

**Typography**:
- Display: DM Sans (headers, logo)
- Body: IBM Plex Sans (content, UI)
- Font sizes: 14px (UI), 16px (body), 18-20px (headings), 24px (logo)

**Motion**: Hybrid
- Staggered page load reveal (100ms stagger, 300ms fade)
- Conversation animations (slide + fade, 300ms)
- Score meter transitions (400ms ease-out)
- Tab switches (200ms fade)

## Implementation Details

### CSS Variables
```css
--color-slate-blue: #475569;
--color-slate-blue-dark: #334155;
--color-sage-green: #6B8E6F;
--color-warm-gray-50: #F5F5F4;
--color-warm-gray-400: #78716C;
--color-warm-gray-800: #1C1917;
--color-amber: #F59E0B;
--color-amber-dark: #D97706;
```

### Background
- Subtle gradient mesh (slate blue → sage green, low opacity)
- Optional noise texture overlay
- Not flat white

### Component Styling
- Tabs: Slate blue bg, amber bottom border when active
- Topic cards: Subtle shadow, sage green border on hover
- Message bubbles: User (slate blue), AI (warm gray-100)
- Input: Warm gray border, amber focus state
- Score meters: Sage green fill, smooth animation

### Spacing
- 8px grid system (4px, 8px, 16px, 24px, 32px)
- Generous content padding (24px)
- Tighter navigation spacing (16px)

### Animations
- CSS-only (transform, opacity)
- Will-change hints for performance
- Reduced motion support

## Files to Update
- `src/app/globals.css` - Color system, typography, background
- `src/app/page.tsx` - Main layout styling
- `src/components/*` - All component styles
- Add Google Fonts for DM Sans and IBM Plex Sans
