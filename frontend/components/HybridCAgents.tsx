import React from "react";

type AgentVariant =
  | "orchestrator"
  | "engineer"
  | "analyst"
  | "architect"
  | "creative"
  | "operations"
  | "financial";

type HybridCAgentFaceProps = {
  variant: AgentVariant;
  size?: number;
  className?: string;
  enableHoverEffects?: boolean;
};

/**
 * Hybrid-C data-mesh AI face
 * One SVG blueprint, tinted & detailed per variant.
 */
const VARIANT_CONFIG: Record<
  AgentVariant,
  {
    accent: string;
    accentSoft: string;
    core: string;
    bgGlow: string;
    label: string;
  }
> = {
  orchestrator: {
    accent: "#EA2323",
    accentSoft: "#EA232355",
    core: "#FFFFFF",
    bgGlow: "#EA232322",
    label: "ORCH",
  },
  engineer: {
    accent: "#33A1FF",
    accentSoft: "#33A1FF55",
    core: "#DFF2FF",
    bgGlow: "#33A1FF22",
    label: "ENG",
  },
  analyst: {
    accent: "#27E68C",
    accentSoft: "#27E68C55",
    core: "#E5FFF3",
    bgGlow: "#27E68C22",
    label: "ANA",
  },
  architect: {
    accent: "#FF9B33",
    accentSoft: "#FF9B3355",
    core: "#FFF3E0",
    bgGlow: "#FF9B3322",
    label: "ARC",
  },
  creative: {
    accent: "#C252FF",
    accentSoft: "#C252FF55",
    core: "#F5E6FF",
    bgGlow: "#C252FF22",
    label: "CRV",
  },
  operations: {
    accent: "#FF4655",
    accentSoft: "#FF465555",
    core: "#FFE5E7",
    bgGlow: "#FF465522",
    label: "OPS",
  },
  financial: {
    accent: "#E5C555",
    accentSoft: "#E5C55555",
    core: "#FFF8DD",
    bgGlow: "#E5C55522",
    label: "FIN",
  },
};

export const HybridCAgentFace: React.FC<HybridCAgentFaceProps> = ({
  variant,
  size = 160,
  className,
  enableHoverEffects = true,
}) => {
  const cfg = VARIANT_CONFIG[variant];
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div 
      className={`relative inline-block ${enableHoverEffects ? 'hover-agent-face' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered && enableHoverEffects ? 'rotateY(5deg) rotateX(-5deg)' : 'none',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Orbiting glow ring - only for Orchestrator when hovered */}
      {variant === 'orchestrator' && isHovered && enableHoverEffects && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            animation: 'orbit 3s linear infinite',
          }}
        >
          <div
            className="absolute top-1/2 left-1/2 w-full h-full rounded-full"
            style={{
              background: `radial-gradient(circle, transparent 45%, ${cfg.accent}40 48%, transparent 51%)`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: isHovered && enableHoverEffects 
            ? `drop-shadow(0 0 20px ${cfg.accent}80) drop-shadow(0 0 40px ${cfg.accent}40)` 
            : undefined,
          transition: 'filter 0.3s ease',
        }}
      >
      <defs>
        {/* Background radial glow */}
        <radialGradient id={`bgGlow-${variant}`} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor={cfg.bgGlow} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        {/* Core gradient */}
        <radialGradient id={`coreGradient-${variant}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={cfg.core} />
          <stop offset="100%" stopColor="#050509" />
        </radialGradient>

        {/* Accent stroke gradient */}
        <linearGradient
          id={`accentStroke-${variant}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={cfg.accent} />
          <stop offset="100%" stopColor={cfg.accentSoft} />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle
        cx="100"
        cy="100"
        r="94"
        fill={`url(#bgGlow-${variant})`}
        opacity="0.9"
      />
      <circle
        cx="100"
        cy="100"
        r="82"
        fill={`url(#coreGradient-${variant})`}
        stroke="#15151C"
        strokeWidth="2"
      />

      {/* Data grid lines */}
      <g stroke="#262630" strokeWidth="0.5" opacity="0.5">
        {Array.from({ length: 7 }).map((_, i) => {
          const y = 50 + i * 10;
          return <line key={`h-${i}`} x1="40" y1={y} x2="160" y2={y} />;
        })}
        {Array.from({ length: 7 }).map((_, i) => {
          const x = 50 + i * 10;
          return <line key={`v-${i}`} x1={x} y1="40" x2={x} y2="160" />;
        })}
      </g>

      {/* Outer hex / head frame */}
      <polygon
        points="100,32 150,60 150,120 100,148 50,120 50,60"
        fill="none"
        stroke={`url(#accentStroke-${variant})`}
        strokeWidth="3"
      />

      {/* Inner mesh shards */}
      <path
        d="M70 60 L130 60 L140 90 L100 130 L60 90 Z"
        fill="#050509"
        stroke={cfg.accentSoft}
        strokeWidth="1"
      />
      <path
        d="M80 70 L120 70 L130 88 L100 120 L70 88 Z"
        fill="#070711"
        stroke="#2B2B35"
        strokeWidth="1"
      />

      {/* Core node */}
      <circle
        cx="100"
        cy="95"
        r="10"
        fill={cfg.core}
        stroke={cfg.accent}
        strokeWidth="2"
      />
      <circle cx="100" cy="95" r="18" fill="none" stroke={cfg.accentSoft} />
      <circle cx="100" cy="95" r="26" fill="none" stroke="#2A2A33" />

      {/* Connectivity lines from core */}
      <g stroke={cfg.accentSoft} strokeWidth="1">
        <line x1="100" y1="95" x2="70" y2="80" />
        <line x1="100" y1="95" x2="130" y2="80" />
        <line x1="100" y1="95" x2="70" y2="115" />
        <line x1="100" y1="95" x2="130" y2="115" />
      </g>

      {/* Eyes – data rings (horizontal) */}
      <g>
        {/* Left */}
        <ellipse
          cx="78"
          cy="92"
          rx="9"
          ry="6"
          fill="#050509"
          stroke="#3A3A44"
          strokeWidth="1"
        />
        <ellipse
          cx="78"
          cy="92"
          rx="5"
          ry="3.5"
          fill={cfg.accentSoft}
          stroke={cfg.accent}
          strokeWidth="1"
        />
        <rect
          x="74"
          y="90.5"
          width="8"
          height="3"
          rx="1.5"
          fill={cfg.core}
          opacity="0.8"
        />

        {/* Right */}
        <ellipse
          cx="122"
          cy="92"
          rx="9"
          ry="6"
          fill="#050509"
          stroke="#3A3A44"
          strokeWidth="1"
        />
        <ellipse
          cx="122"
          cy="92"
          rx="5"
          ry="3.5"
          fill={cfg.accentSoft}
          stroke={cfg.accent}
          strokeWidth="1"
        />
        <rect
          x="118"
          y="90.5"
          width="8"
          height="3"
          rx="1.5"
          fill={cfg.core}
          opacity="0.8"
        />
      </g>

      {/* "Mouth" – status bus */}
      <rect
        x="76"
        y="115"
        width="48"
        height="8"
        rx="3"
        fill="#070711"
        stroke="#2A2A35"
        strokeWidth="1"
      />
      <rect
        x="78"
        y="117"
        width="18"
        height="4"
        rx="2"
        fill={cfg.accentSoft}
      />
      <rect
        x="99"
        y="117"
        width="10"
        height="4"
        rx="2"
        fill={cfg.core}
        opacity="0.6"
      />
      <rect
        x="111"
        y="117"
        width="11"
        height="4"
        rx="2"
        fill={cfg.accent}
        opacity="0.9"
      />

      {/* Side "ports" */}
      <rect
        x="44"
        y="88"
        width="6"
        height="18"
        rx="2"
        fill="#050509"
        stroke={cfg.accentSoft}
        strokeWidth="1"
      />
      <rect
        x="150"
        y="88"
        width="6"
        height="18"
        rx="2"
        fill="#050509"
        stroke={cfg.accentSoft}
        strokeWidth="1"
      />

      {/* Bottom tag with label (ENG, ARC, etc.) */}
      <g>
        <rect
          x="72"
          y="145"
          width="56"
          height="16"
          rx="4"
          fill="#050509"
          stroke={cfg.accentSoft}
          strokeWidth="1"
        />
        <text
          x="100"
          y="157"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
          fontSize="9"
          fill={cfg.accent}
          letterSpacing="2"
        >
          {cfg.label}
        </text>
      </g>
    </svg>
    </div>
  );
};

// ---- Convenience wrappers for each role ----

export const OrchestratorFace: React.FC<
  Omit<HybridCAgentFaceProps, "variant">
> = (props) => <HybridCAgentFace variant="orchestrator" {...props} />;

export const EngineerFace: React.FC<Omit<HybridCAgentFaceProps, "variant">> = (
  props,
) => <HybridCAgentFace variant="engineer" {...props} />;

export const AnalystFace: React.FC<Omit<HybridCAgentFaceProps, "variant">> = (
  props,
) => <HybridCAgentFace variant="analyst" {...props} />;

export const ArchitectFace: React.FC<Omit<HybridCAgentFaceProps, "variant">> = (
  props,
) => <HybridCAgentFace variant="architect" {...props} />;

export const CreativeFace: React.FC<Omit<HybridCAgentFaceProps, "variant">> = (
  props,
) => <HybridCAgentFace variant="creative" {...props} />;

export const OperationsFace: React.FC<
  Omit<HybridCAgentFaceProps, "variant">
> = (props) => <HybridCAgentFace variant="operations" {...props} />;

export const FinancialFace: React.FC<
  Omit<HybridCAgentFaceProps, "variant">
> = (props) => <HybridCAgentFace variant="financial" {...props} />;
