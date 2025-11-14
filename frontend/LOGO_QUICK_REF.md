# 🎨 Crew-7 Logo Quick Reference

## Import the Component

```tsx
import { Crew7Logo } from '@/components/Crew7Logo';
```

## Common Use Cases

### 🏠 App Header/Navbar
```tsx
import { HeaderLogo } from '@/components/Crew7Logo';

<header>
  <HeaderLogo />
</header>
```

### 🔐 Auth Screens
```tsx
import { AuthLogo } from '@/components/Crew7Logo';

<div className="auth-container">
  <AuthLogo />
  <form>{/* ... */}</form>
</div>
```

### 📱 Mobile/Collapsed Sidebar
```tsx
import { CompactLogo } from '@/components/Crew7Logo';

<aside className="sidebar">
  <CompactLogo />
</aside>
```

### ⚙️ Settings/Footer
```tsx
import { MinimalLogo } from '@/components/Crew7Logo';

<footer>
  <MinimalLogo />
</footer>
```

## All Variants

| Variant | When to Use | Size | Link |
|---------|-------------|------|------|
| `horizontal` | Desktop headers, main navbar | `md` | ✅ Yes |
| `vertical` | Auth screens, hero sections | `lg` | ❌ No |
| `sign` | Mobile, favicon, compact spaces | `sm` | ✅ Yes |
| `text` | Settings, documents, footers | `sm` | ❌ No |

## Sizes

- **sm**: Small (24-32px for icon, 80px+ for text)
- **md**: Medium (40-48px for icon, 120px+ for text) ⭐ Default
- **lg**: Large (64-80px for icon, 160px+ for text)

## Custom Usage

```tsx
<Crew7Logo 
  variant="horizontal"  // or 'vertical' | 'sign' | 'text'
  size="md"             // or 'sm' | 'lg'
  asLink={true}         // makes it clickable to home
  className="my-custom-class"
/>
```

## Responsive Pattern

```tsx
{/* Mobile */}
<div className="md:hidden">
  <Crew7Logo variant="sign" size="sm" asLink />
</div>

{/* Desktop */}
<div className="hidden md:block">
  <Crew7Logo variant="horizontal" size="md" asLink />
</div>
```

## Pre-configured Helpers

```tsx
import { 
  HeaderLogo,    // horizontal + md + link
  AuthLogo,      // vertical + lg + centered
  CompactLogo,   // sign + sm + link
  HeroLogo,      // vertical + lg
  MinimalLogo,   // text + sm
} from '@/components/Crew7Logo';
```

## ✅ Do's

- ✅ Use `HeaderLogo` for most headers
- ✅ Use `AuthLogo` for auth screens
- ✅ Use `CompactLogo` for mobile/small spaces
- ✅ Maintain clear space around logo
- ✅ Use on dark backgrounds

## ❌ Don'ts

- ❌ Don't stretch or skew the logo
- ❌ Don't use text-only below 80px width
- ❌ Don't place on light backgrounds without dark container
- ❌ Don't change logo colors

## Files

All SVGs are in `/public`:
- `crew7-logo-sign-only.svg`
- `crew7-logo-text-only.svg`
- `crew7-logo-text+sign-horizantal.svg` (note typo)
- `crew7-logo-text+sign-vertical.svg`

## Accessibility

All logos include:
- ARIA labels for screen readers
- Keyboard navigation support
- Focus indicators
- Semantic HTML

---

📖 **Full docs**: See `LOGO_USAGE.md`  
🎯 **Examples**: See `components/LogoExamples.tsx`  
🔧 **Source**: See `components/Crew7Logo.tsx`
