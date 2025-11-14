import React from 'react';

export type AgentKey =
  | 'orion'
  | 'vega'
  | 'nova'
  | 'atlas'
  | 'lyra'
  | 'helix'
  | 'quark'
  | 'sigma'
  | 'rho'
  | 'kappa'
  | 'zeta'
  | 'pyxis'
  | 'draco'
  | 'cygnus'
  | 'aquila'
  | 'kepler'
  | 'titan'
  | 'neon'
  | 'echo'
  | 'pulse'
  | 'hubble';

type AgentIconProps = {
  id: AgentKey;
  size?: number;
  className?: string;
  idle?: boolean;
  hoverGlow?: boolean;
  status?: 'idle' | 'typing' | 'done' | 'error';
};

export const AgentIcon: React.FC<AgentIconProps> = ({
  id,
  size = 40,
  className = '',
  idle = false,
  hoverGlow = true,
  status,
}) => {
  const statusClass = status === 'typing' ? 'c7-typing' : status === 'done' ? 'c7-glow' : '';
  const classes = [
    className.trim(),
    idle ? 'c7-idle' : '',
    hoverGlow ? 'c7-hover' : '',
    statusClass,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <svg
      width={size}
      height={size}
      className={classes}
      aria-hidden="true"
      focusable="false"
    >
      <use href={`#agent-${id}`} />
    </svg>
  );
};
