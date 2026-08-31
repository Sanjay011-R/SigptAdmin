---
name: brand-ui-redesign
description: Apply this brand's minimal UI/UX design system when the user explicitly asks to "redesign" a page/component or says "apply UI/UX skill." Do NOT trigger automatically on every UI task — only on explicit redesign requests. Enforces the brand palette (#FF7A00 orange, #081B33 navy), minimal layout principles, type scale, spacing, and component rules so redesigns are consistent, clean, and on-brand rather than generic AI-default output.
---

# Brand UI/UX Redesign Skill

Use this skill only when the user explicitly says "redesign this," "apply UI/UX skill," or clearly asks for this brand's design to be applied to an existing page/component. For net-new UI built without that explicit ask, don't force this skill in — just build normally (or defer to a general design skill if one is available).

When triggered, treat the task as: take the existing page/component and rebuild its visual layer to match this brand system, while preserving its actual content and functionality.

## Brand Design Tokens

**Color** — Use only these, no invented colors:
- `--brand-orange: #FF7A00` — primary accent. Use for primary CTAs, active states, key highlights, links on hover. Never as a large background fill (too loud) — reserve it for small, high-impact elements.
- `--brand-navy: #081B33` — primary dark. Use for headers, footers, primary text on light backgrounds, or as the main dark background in a dark-mode variant.
- `--white: #FFFFFF` — primary background in light mode.
- `--gray-50: #F7F8FA` — subtle section backgrounds, card fills.
- `--gray-200: #E4E7EC` — hairline borders, dividers.
- `--gray-500: #6B7280` — secondary/muted text.
- `--gray-900: #111827` — body text (use this over pure black; use `--brand-navy` for headings instead of gray-900 where it reads as "brand").

Derive tints/shades only via opacity or standard HSL lightness steps off these two brand colors — don't introduce new hues.

**Typography** — minimal, restrained, one display + one body:
- Headings: a clean geometric or grotesk sans (e.g. Inter, Manrope, or system-ui stack) — semi-bold/bold, tight letter-spacing (-0.01 to -0.02em) at large sizes.
- Body: same family, regular weight, comfortable line-height (1.5–1.6).
- Scale (px, desktop): 56 / 40 / 32 / 24 / 18 / 16 / 14. Don't invent intermediate sizes.
- No decorative or script fonts. Minimal means the type system is quiet and consistent, not attention-seeking.

**Spacing & layout**:
- 8px base spacing unit. All margins/padding/gaps are multiples of 8 (or 4 for tight inline spacing).
- Generous whitespace over dense packing — minimal UI means removing until only what's necessary remains.
- Max content width ~1200px, centered, with consistent side gutters (24px mobile, 64–96px desktop).
- Border-radius: strictly `rounded-sm` (2px–4px) for cards, inputs, buttons, modals, and badges. Avoid large rounded corners (`rounded-xl` / `rounded-2xl`) and never use `rounded-full` pill shapes.
- Borders: 1px hairline `--gray-200`, used sparingly — prefer clean whitespace and subtle background contrast.

**Components**:
- Primary button: `--brand-orange` fill, white text, `rounded-sm` radius, no gradient, no drop shadow — flat and confident. Hover: slightly darken (mix with black ~10%).
- Secondary button: transparent fill, `--brand-navy` 1px border and text, `rounded-sm` radius.
- Cards: white or `--gray-50` fill, `--gray-200` 1px border, `rounded-sm` radius.
- Badges & Tags: Solid background color fill with `rounded-sm` radius. **No border stroke** on badges (e.g. solid subtle bg like `bg-gray-100` or `bg-purple-100` with solid text, `rounded-sm`, no border ring).
- Nav/header: `--brand-navy` background with white text, or white background with `--brand-navy` text — pick one per page, don't mix.
- Icons: single-weight line icons, no filled/duotone unless it's the signature accent element.
- Unique Brand Touch: Crisp square/subtle rectangular geometry (`rounded-sm`), sharp typography contrast with `#081B33` navy titles, single-point `#FF7A00` orange indicator dots/markers, and borderless solid status badges.

## Process when redesigning

1. **Look at the existing page/component first.** Identify its actual content and functional elements — don't discard real copy or features while restyling.
2. **Apply the tokens above directly** — don't reinterpret the palette or invent new colors "to fit the vibe." The brand system is fixed; the layout and composition are where judgement comes in.
3. **Minimal means subtraction.** Before finishing, look for anything to remove: extra borders, redundant labels, decorative icons, unnecessary color use. If orange appears more than once or twice per screen as anything other than a small accent, pull it back.
4. **One accent moment per screen.** Pick a single place (e.g. the primary CTA, or one highlighted stat) where `--brand-orange` really pops. Everything else stays navy/white/gray so that moment reads clearly.
5. **Check contrast and consistency**: white text only on navy or orange (verify contrast), navy or gray-900 text only on white/gray-50 backgrounds. Use `rounded-sm` radius consistently across all elements — don't mix rounded-full pills or rounded-xl curves.
6. **Responsive check**: at minimum, verify layout collapses cleanly to a single column under ~640px, spacing scales down (use the 8/4px units, not arbitrary values), and text doesn't wrap awkwardly at the largest scale size.

## What NOT to do

- Don't add gradients, glassmorphism, or heavy shadows — this is a flat, minimal system.
- Don't use orange as a large background — it's an accent, not a base color.
- Don't use `rounded-full` or `rounded-xl` curves on badges, buttons, cards, or inputs — strictly use `rounded-sm`.
- Don't add borders to badges — badges must be solid background fills with `rounded-sm`.
- Don't introduce a second display typeface "for personality." Personality here comes from restraint, clean `rounded-sm` geometric structure, and precise spacing.
- Don't add motion/animation unless the user asks — minimal UI defaults to static, confident layouts.