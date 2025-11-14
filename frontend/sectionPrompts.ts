export type SectionPrompt = {
  id: string;
  label: string;
  sidebarIcon: string;
  prompt: string;
};

export const SECTION_PROMPTS: SectionPrompt[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    sidebarIcon: 'LayoutDashboard',
    prompt: `Create a dark-mode Crew-7 dashboard that fits the existing navy palette (#0D141C base, cards at #151E28) with soft red accents (#E5484D), 20px radii, and subtle shadows. The header should greet the signed-in commander by name. Present an analytics row with four cards: “Runs Today” featuring a bold total and compact sparkline; “Success Rate” rendered as a percentage ring; “Avg Latency” in milliseconds with a slim trend badge; and “Token Usage” shown as a micro bar chart. Beneath, add an “Active Crews” panel with a 7-slot grid of crew cards (robot avatar, status, most recent run) alongside a right-rail streaming console that ingests SSE/WS events and renders type-tagged chips for token/log/tool/metric updates. Include a slim timeline strip visualising the last 60 minutes. Keep typography in Inter or Space Grotesk, ensure animations remain subtle, and keep the layout performant on mid-tier hardware.`,
  },
  {
    id: 'project-details',
    label: 'Projects → Project Details',
    sidebarIcon: 'FolderKanban',
    prompt: `Design a Crew-7 dark-themed Project Details page. The hero block should show the project title, a status chip, and the assigned crew rendered as a robot avatar group. Provide tabs for Overview · Runs · Artifacts · Memory · Settings. In Overview, surface the mission brief, key metrics (success rate, last run, artifact count), and explicit next steps. Runs should be a table listing status, duration, model, token usage, and quick links to run logs. Artifacts belongs to a grid of files with contextual previews and badges for code/text/image. Memory summarizes the linked vector collection and displays the top 5 retrieved contexts with score + snippet. A right rail hosts a “Start New Run” quick form accepting a prompt and primary parameters. Retain red accents for CTAs and match spacing/radii already used in the login and chat experiences.`,
  },
  {
    id: 'collections',
    label: 'Collections',
    sidebarIcon: 'Boxes',
    prompt: `Build a Collections screen for semantic memory management. The primary view lists vector collections with their size, last updated timestamp, and the crew currently linked. Selecting a collection opens details that surface top queries (search phrases), a similarity trend chart, an embeddings preview rendered as a 2D projection, and CRUD controls (add vectors, reindex, export). Style with card surfaces, muted borders, and restrained red highlights to stay on-brand.`,
  },
  {
    id: 'workspace',
    label: 'Workspace',
    sidebarIcon: 'PanelsTopLeft',
    prompt: `Create a collaborative Workspace canvas where strategists drop briefs, files, and notes that feed the crew. The left rail hosts a folder tree spanning repositories, docs, and datasets. The center pane acts as a document/code viewer with tabs. The right Context Panel surfaces detected entities, smart suggestions, and “Send to Crew” buttons. The top toolbar exposes actions: Import from GitHub/Drive, “Pin as Context,” and “Start Session.” Maintain the dark theme, rounded surfaces, and subtle glow treatments for interactive elements.`,
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    sidebarIcon: 'Store',
    prompt: `Design a cinematic Marketplace grid of crew templates. Each card needs a robot avatar, crew name, role (e.g., Backend, QA, Finance), rating, install count, and badges such as “100+ runs” or “<300ms routing.” Provide filters for role, performance, and price/freemium. Tapping a card reveals a detail modal with description, enabled tools, favored models, sample outputs, and Install/Fork calls-to-action. Apply soft glows on hover and preserve a clean layout.`,
  },
  {
    id: 'crew-details',
    label: 'Crew Details / Create–Modify',
    sidebarIcon: 'Bot',
    prompt: `Build a Crew Editor experience with tabs: Overview (name, role, seven agent avatars, summary), Models & Tools (select models for general/coder/embed workloads, toggle tools from the allowlist like http_fetch or file_read/write while displaying safety badges), Memory (configure KV namespace and vector collection with reset buttons), Env & Secrets (masked inputs with scope warnings), and Evaluate (self-check tests with pass rate). Incorporate quick actions for “Fork Crew,” “Rotate API Key,” and “Launch Session.” Primary CTAs should use the red accent and match existing spacing/radius tokens.`,
  },
  {
    id: 'runs',
    label: 'Runs',
    sidebarIcon: 'Activity',
    prompt: `Extend the Runs section with a command-ready feed of executions. Each entry lists model, crew, duration, token usage, billing impact, and status. Provide filters for status/model/time, streaming log inspectors, and quick rerun buttons that reuse prior parameters. Ensure the design aligns with the Crew-7 dark system and leverages the same component radii.`,
  },
  {
    id: 'settings',
    label: 'Settings',
    sidebarIcon: 'Settings',
    prompt: `Refine the global Settings surface so it mirrors the Crew-7 visual language: dark navy backgrounds, white/10 borders, and #E5484D highlights for critical actions. Organize panels for account, organisation, billing, security, integrations, and notifications. Include contextual helper copy, inline validation, and confirm modals for destructive actions while preserving the existing spacing scale.`,
  },
];
