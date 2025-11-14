export type CrewRole =
  | 'Orchestrator'
  | 'Coder'
  | 'Frontend'
  | 'Backend'
  | 'QA'
  | 'Data'
  | 'Ops'
  | 'PM'
  | 'Finance'
  | 'Research'
  | 'Writer'
  | 'Analyst'
  | 'Security'
  | 'Support'
  | 'Growth';

export const ROLE_TO_AGENT_ID: Record<CrewRole, string> = {
  Orchestrator: 'atlas',
  Coder: 'helix',
  Frontend: 'vega',
  Backend: 'titan',
  QA: 'zeta',
  Data: 'sigma',
  Ops: 'kappa',
  PM: 'orion',
  Finance: 'rho',
  Research: 'kepler',
  Writer: 'nova',
  Analyst: 'hubble',
  Security: 'draco',
  Support: 'echo',
  Growth: 'pulse',
};
