import type { CrewRole } from './crew7-roles';
import { ROLE_TO_AGENT_ID } from './crew7-roles';

export const AGENT_IDS = [
  'orion',
  'vega',
  'nova',
  'atlas',
  'lyra',
  'helix',
  'quark',
  'sigma',
  'rho',
  'kappa',
  'zeta',
  'pyxis',
  'draco',
  'cygnus',
  'aquila',
  'kepler',
  'titan',
  'neon',
  'echo',
  'pulse',
  'hubble',
] as const;

export type AgentId = typeof AGENT_IDS[number];

export function idForRole(role: CrewRole | string): string {
  return (ROLE_TO_AGENT_ID as Record<string, string>)[role] ?? 'orion';
}

export function crewSet(seed: string, size = 7): string[] {
  const ids = [...AGENT_IDS];
  let h = hash(seed);
  for (let i = ids.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, size);
}

function hash(input: string) {
  let value = 2166136261;
  for (let i = 0; i < input.length; i++) {
    value = (value ^ input.charCodeAt(i)) * 16777619;
  }
  return value >>> 0;
}
