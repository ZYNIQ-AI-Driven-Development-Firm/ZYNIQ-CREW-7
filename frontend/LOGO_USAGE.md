# Crew-7 Logo Usage Guidelines

## Overview

The Crew-7 logo component provides a consistent, accessible way to display the brand across all parts of the application. This document outlines when and how to use each logo variant.

## Logo Assets

The logo kit includes four main assets located in `/public`:

1. **Sign-only mark** (`crew7-logo-sign-only.svg`) - Icon/favicon
2. **Text-only wordmark** (`crew7-logo-text-only.svg`) - Minimal branding
3. **Horizontal lockup** (`crew7-logo-text+sign-horizantal.svg`) - Primary brand mark
4. **Vertical lockup** (`crew7-logo-text+sign-vertical.svg`) - Centered layouts

## Component API

### Basic Usage

```tsx
import { Crew7Logo } from '@/components/Crew7Logo';

// Default: horizontal lockup at medium size
<Crew7Logo />

// With custom variant and size
<Crew7Logo variant="vertical" size="lg" />

// As a clickable link to home page
<Crew7Logo variant="horizontal" size="md" asLink />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'sign' \| 'text' \| 'horizontal' \| 'vertical'` | `'horizontal'` | Logo variant to display |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the logo |
| `asLink` | `boolean` | `false` | Wrap logo in a link to home page |
| `className` | `string` | `''` | Additional CSS classes |
| `ariaLabel` | `string` | `'Crew-7'` | Accessible label for screen readers |

## Logo Variants

### 1. Sign-only (`variant="sign"`)

**When to use:**
- Favicon and browser tab icons
- Mobile app headers with limited space
- Collapsed sidebar state
- Small status chips or badges
- Any compact, square container

**Size recommendations:**
- `sm`: 24-32px (mobile, tight spaces)
- `md`: 40-48px (default buttons, sidebar)
- `lg`: 64-80px (large icons, splash screens)

**Examples:**

```tsx
// Mobile header
<Crew7Logo variant="sign" size="sm" asLink />

// Sidebar collapsed state
<Crew7Logo variant="sign" size="md" />

// Large icon in empty state
<Crew7Logo variant="sign" size="lg" />
```

**Usage notes:**
- ✅ Perfect for square containers
- ✅ Maintains brand recognition at small sizes
- ❌ Avoid pairing with "Crew-7" text directly adjacent (redundant)

---

### 2. Text-only (`variant="text"`)

**When to use:**
- Settings and legal pages
- Email templates and PDF exports
- Inline footers
- Document headers
- Minimal text-based interfaces

**Size recommendations:**
- `sm`: ~80-100px width (footers, documents)
- `md`: ~120px width (headers, settings)
- `lg`: ~160px width (hero text blocks)

**Examples:**

```tsx
// Settings page header
<Crew7Logo variant="text" size="md" />

// Email template footer
<Crew7Logo variant="text" size="sm" />

// Document title
<Crew7Logo variant="text" size="lg" />
```

**Usage notes:**
- ✅ Clean, minimal branding
- ✅ Great for text-heavy layouts
- ⚠️ Must be large enough to read (minimum 80px width)
- ❌ Don't use below 80px width (legibility issues)

---

### 3. Horizontal lockup (`variant="horizontal"`) **[DEFAULT]**

**When to use:**
- Main app header/navbar (desktop)
- Landing page top-left branding
- Marketing section headers
- Any wide horizontal space
- Default choice for most brand placements

**Size recommendations:**
- `sm`: ~80-90px height (compact headers)
- `md`: ~100-120px height (standard headers) **[DEFAULT]**
- `lg`: ~140-160px height (hero sections, large displays)

**Examples:**

```tsx
// Desktop app header (most common)
<Crew7Logo variant="horizontal" size="md" asLink />

// Compact mobile landscape
<Crew7Logo variant="horizontal" size="sm" asLink />

// Landing page hero
<Crew7Logo variant="horizontal" size="lg" />
```

**Usage notes:**
- ✅ **Primary brand mark** - use this by default
- ✅ Best for desktop headers and navbars
- ✅ Provides complete branding (icon + text)
- ⚠️ Ensure enough horizontal padding (at least one icon-width clearance)

---

### 4. Vertical lockup (`variant="vertical"`)

**When to use:**
- Landing page hero sections (centered)
- Authentication screens (sign in/sign up)
- Empty states and welcome panels
- Centered brand moments
- Any tall, centered layout

**Size recommendations:**
- `sm`: ~160-200px height (compact auth screens)
- `md`: ~240-280px height (standard hero sections)
- `lg`: ~320-400px height (large hero, splash screens)

**Examples:**

```tsx
// Auth screen (centered)
<div className="flex justify-center">
  <Crew7Logo variant="vertical" size="lg" />
</div>

// Hero section
<Crew7Logo variant="vertical" size="md" />

// Empty state panel
<Crew7Logo variant="vertical" size="sm" />
```

**Usage notes:**
- ✅ Perfect for centered, vertical layouts
- ✅ Creates balanced, stacked brand mark
- ✅ Works well above or below headlines
- ⚠️ Always center-align in container
- ⚠️ Give more vertical breathing room than horizontal variant

---

## Pre-configured Components

For common use cases, import pre-configured logo components:

```tsx
import {
  HeaderLogo,      // Horizontal, medium, as link
  AuthLogo,        // Vertical, large, centered
  CompactLogo,     // Sign-only, small, as link
  HeroLogo,        // Vertical, large
  MinimalLogo,     // Text-only, small
} from '@/components/Crew7Logo';

// Examples
<HeaderLogo />
<AuthLogo />
<CompactLogo />
<HeroLogo />
<MinimalLogo />
```

## Global Rules

### ✅ DO:
- Keep at least one icon-width of padding around logos (clear space)
- Maintain original aspect ratios (component handles this automatically)
- Prefer dark backgrounds (brand colors are optimized for dark mode)
- Use `asLink` prop for clickable brand marks in navigation
- Use appropriate variant for layout context

### ❌ DON'T:
- Never stretch, skew, or change aspect ratio
- Don't use logos smaller than minimum size recommendations
- Don't change logo colors (use SVG assets as-is)
- Don't place logos on light backgrounds without dark container/overlay
- Don't pair sign-only or text-only with redundant "Crew-7" text

## Accessibility

All logo components include proper accessibility attributes:

- **As static logo**: `role="img"` and `aria-label="Crew-7"`
- **As link**: `aria-label="Crew-7 - Go to home page"`
- Keyboard focus indicators with focus rings
- Sufficient color contrast on dark backgrounds

## File Paths

All logo SVGs are located in the `/public` folder and served from root:

```tsx
/crew7-logo-sign-only.svg
/crew7-logo-text-only.svg
/crew7-logo-text+sign-horizantal.svg  // Note: typo in filename
/crew7-logo-text+sign-vertical.svg
```

The component automatically maps variants to correct file paths.

## Implementation Checklist

When adding a logo to your UI:

1. ✅ Identify the layout context (header, hero, auth, etc.)
2. ✅ Choose appropriate variant based on space and purpose
3. ✅ Select size based on container and viewport
4. ✅ Add `asLink` if logo should navigate to home
5. ✅ Ensure sufficient clear space around logo
6. ✅ Verify accessibility (keyboard navigation, screen readers)
7. ✅ Test on dark background (brand standard)

## Examples by Context

### App Shell Header
```tsx
import { HeaderLogo } from '@/components/Crew7Logo';

<header className="flex items-center justify-between px-6 py-4">
  <HeaderLogo />
  {/* Other header content */}
</header>
```

### Authentication Screen
```tsx
import { AuthLogo } from '@/components/Crew7Logo';

<div className="flex min-h-screen items-center justify-center">
  <div className="w-full max-w-md space-y-8">
    <AuthLogo />
    <form>{/* Auth form */}</form>
  </div>
</div>
```

### Mobile Header with Responsive Logos
```tsx
import { Crew7Logo } from '@/components/Crew7Logo';

<header>
  {/* Mobile: show compact icon */}
  <div className="block md:hidden">
    <Crew7Logo variant="sign" size="sm" asLink />
  </div>
  
  {/* Desktop: show full horizontal logo */}
  <div className="hidden md:block">
    <Crew7Logo variant="horizontal" size="md" asLink />
  </div>
</header>
```

### Landing Page Hero
```tsx
import { HeroLogo } from '@/components/Crew7Logo';

<section className="flex flex-col items-center justify-center py-20">
  <HeroLogo />
  <h1 className="mt-8 text-5xl font-bold">
    Welcome to Crew-7
  </h1>
</section>
```

### Settings Page
```tsx
import { MinimalLogo } from '@/components/Crew7Logo';

<div className="border-b pb-4">
  <MinimalLogo />
  <h2 className="mt-4 text-2xl font-semibold">Settings</h2>
</div>
```

---

## Questions?

For additional logo usage questions or custom implementations, refer to the component source code at `components/Crew7Logo.tsx` or consult the design team.
