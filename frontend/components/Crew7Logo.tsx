import React from 'react';

/**
 * Crew7Logo Component
 * 
 * A reusable component for displaying Crew-7 brand logos with proper accessibility
 * and responsive sizing. Supports four logo variants based on the logo kit.
 * 
 * Usage Guidelines:
 * - Sign-only: Use for compact, square icons (favicon, mobile header, collapsed sidebar)
 * - Text-only: Use for minimal interfaces (settings pages, documents, email templates)
 * - Horizontal: Use for wide horizontal spaces (desktop navbar, landing page header)
 * - Vertical: Use for centered, stacked layouts (hero sections, auth screens)
 * 
 * @example
 * // Desktop header with horizontal lockup
 * <Crew7Logo variant="horizontal" size="md" asLink />
 * 
 * @example
 * // Auth screen with centered vertical lockup
 * <Crew7Logo variant="vertical" size="lg" />
 * 
 * @example
 * // Mobile header with compact sign-only icon
 * <Crew7Logo variant="sign" size="sm" asLink />
 */

export type LogoVariant = 'sign' | 'text' | 'horizontal' | 'vertical';
export type LogoSize = 'sm' | 'md' | 'lg';

export interface Crew7LogoProps {
  /**
   * Logo variant to display
   * - 'sign': Sign-only mark (icon) - Use for compact square spaces
   * - 'text': Text-only wordmark - Use for minimal text-based layouts
   * - 'horizontal': Horizontal lockup (sign + text side-by-side) - Default, use for headers
   * - 'vertical': Vertical lockup (sign + text stacked) - Use for centered hero sections
   * @default 'horizontal'
   */
  variant?: LogoVariant;

  /**
   * Size of the logo
   * - 'sm': Small (24-32px for sign, ~80px for text variants)
   * - 'md': Medium (40-48px for sign, ~120px for text variants)
   * - 'lg': Large (64-80px for sign, ~160px for text variants)
   * @default 'md'
   */
  size?: LogoSize;

  /**
   * If true, wraps the logo in a link to the home page ('/')
   * Adds proper aria-label for accessibility
   * @default false
   */
  asLink?: boolean;

  /**
   * Additional CSS classes to apply to the logo wrapper
   */
  className?: string;

  /**
   * Accessible label for screen readers
   * @default 'Crew-7'
   */
  ariaLabel?: string;
}

// Size mappings for each variant
const SIZE_CLASSES: Record<LogoVariant, Record<LogoSize, string>> = {
  sign: {
    sm: 'w-6 h-6 md:w-8 md:h-8',
    md: 'w-10 h-10 md:w-12 md:h-12',
    lg: 'w-16 h-16 md:w-20 md:h-20',
  },
  text: {
    sm: 'h-6 w-auto md:h-7',
    md: 'h-8 w-auto md:h-9',
    lg: 'h-10 w-auto md:h-12',
  },
  horizontal: {
    sm: 'h-8 w-auto md:h-9',
    md: 'h-10 w-auto md:h-12',
    lg: 'h-14 w-auto md:h-16',
  },
  vertical: {
    sm: 'h-16 w-auto md:h-20',
    md: 'h-24 w-auto md:h-28',
    lg: 'h-32 w-auto md:h-40',
  },
};

// SVG path mappings
const LOGO_PATHS: Record<LogoVariant, string> = {
  sign: '/crew7-logo-sign-only.svg',
  text: '/crew7-logo-text-only.svg',
  // Note: accounting for the typo in the actual filename
  horizontal: '/crew7-logo-text+sign-horizantal.svg',
  vertical: '/crew7-logo-text+sign-vertical.svg',
};

/**
 * Crew7Logo Component
 * 
 * Renders the Crew-7 logo with the specified variant and size.
 * Maintains aspect ratio and provides accessibility attributes.
 */
export const Crew7Logo: React.FC<Crew7LogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  asLink = false,
  className = '',
  ariaLabel = 'Crew-7',
}) => {
  const sizeClass = SIZE_CLASSES[variant][size];
  const logoPath = LOGO_PATHS[variant];

  // Logo image element
  const logoImage = (
    <img
      src={logoPath}
      alt={ariaLabel}
      className={`${sizeClass} ${className} object-contain`}
      style={{
        // Prevent aspect ratio distortion
        aspectRatio: variant === 'sign' ? '1/1' : 'auto',
      }}
      draggable={false}
    />
  );

  // Wrap in link if asLink is true
  if (asLink) {
    return (
      <a
        href="/"
        className="inline-flex items-center justify-center transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#ea2323] focus:ring-offset-2 focus:ring-offset-[#0d1523] rounded-lg"
        aria-label={`${ariaLabel} - Go to home page`}
      >
        {logoImage}
      </a>
    );
  }

  // Return logo wrapped in a div for proper spacing
  return (
    <div
      className="inline-flex items-center justify-center"
      role="img"
      aria-label={ariaLabel}
    >
      {logoImage}
    </div>
  );
};

/**
 * Pre-configured logo components for common use cases
 */

/**
 * Logo for app headers and navigation bars
 * Uses horizontal lockup at medium size
 */
export const HeaderLogo: React.FC<{ asLink?: boolean; className?: string }> = ({
  asLink = true,
  className,
}) => (
  <Crew7Logo
    variant="horizontal"
    size="md"
    asLink={asLink}
    className={className}
  />
);

/**
 * Logo for authentication screens (sign in/sign up)
 * Uses vertical lockup at large size, centered
 */
export const AuthLogo: React.FC<{ className?: string }> = ({ className }) => (
  <div className="flex justify-center">
    <Crew7Logo
      variant="vertical"
      size="lg"
      className={className}
    />
  </div>
);

/**
 * Compact logo icon for mobile headers and collapsed sidebars
 * Uses sign-only variant at small size
 */
export const CompactLogo: React.FC<{ asLink?: boolean; className?: string }> = ({
  asLink = true,
  className,
}) => (
  <Crew7Logo
    variant="sign"
    size="sm"
    asLink={asLink}
    className={className}
  />
);

/**
 * Logo for hero sections and landing pages
 * Uses vertical lockup at large size
 */
export const HeroLogo: React.FC<{ className?: string }> = ({ className }) => (
  <Crew7Logo
    variant="vertical"
    size="lg"
    className={className}
  />
);

/**
 * Minimal text-only logo for settings, documents, and footers
 * Uses text-only variant at small size
 */
export const MinimalLogo: React.FC<{ className?: string }> = ({ className }) => (
  <Crew7Logo
    variant="text"
    size="sm"
    className={className}
  />
);

export default Crew7Logo;
