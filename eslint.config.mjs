// @ts-check
// Architecture lint: layer direction and feature boundaries (docs/game-screens-plan.md §2.1–§2.2).
// Run with `pnpm lint`. Only architectural rules live here; style/quality rules are out of scope.
import boundaries from "eslint-plugin-boundaries";
import tseslint from "typescript-eslint";

/**
 * Element descriptors. Order matters: the first matching descriptor wins, so the
 * specific folders come before the package-wide catch-alls. Workspace imports such as
 * `@mystery-game/game` resolve to `packages/game/dist`, which the catch-alls cover.
 */
const elements = [
  // packages/game – pure domain
  { type: "game-shared", pattern: "packages/game/src/shared" },
  { type: "game-module", pattern: "packages/game/src/*", capture: ["module"] },
  { type: "game", pattern: "packages/game" },
  // packages/contracts
  { type: "contracts", pattern: "packages/contracts" },
  // apps/api – NestJS
  { type: "api-shared", pattern: "apps/api/src/shared" },
  { type: "api-module", pattern: "apps/api/src/modules/*", capture: ["module"] },
  { type: "api", pattern: "apps/api" },
  // apps/web – React
  { type: "web-shared", pattern: "apps/web/src/shared" },
  { type: "web-feature", pattern: "apps/web/src/features/*", capture: ["feature"] },
  { type: "web-app", pattern: "apps/web/src/app" },
  { type: "web", pattern: "apps/web" },
  // apps/e2e – Playwright
  { type: "e2e", pattern: "apps/e2e" },
];

const files = [
  // App-wide runtime configuration (API/socket URLs) – importable from any web layer.
  { category: "config", pattern: "apps/web/src/config.ts" },
  {
    category: "test",
    pattern: ["**/*.test.ts", "**/*.test.tsx", "**/test/**", "**/testFixtures.ts"],
  },
];

/** Shorthands for selectors. */
const el = (/** @type {string} */ type) => ({ to: { element: { type } } });
/** `apps/web/src/config.ts` (part of the `web` element, file category "config"). */
const webConfig = { to: { element: { type: "web" }, file: { categories: "config" } } };
/** Public API of an element: its `index.ts` (or `index.tsx`). */
const entry = (/** @type {string} */ type) => ({
  to: { element: { type, fileInternalPath: "index.{ts,tsx}" } },
});

const policies = [
  // ── packages/game ────────────────────────────────────────────────────────
  { from: { element: { type: "game-shared" } }, allow: [el("game-shared")] },
  {
    from: { element: { type: "game-module" } },
    allow: [
      el("game-shared"),
      entry("game-module"),
      // The board module exposes its static layout file as its public API.
      { to: { element: { type: "game-module", captured: { module: "board" }, fileInternalPath: "layout.ts" } } },
    ],
  },
  { from: { element: { type: "game" } }, allow: [el("game"), el("game-shared"), el("game-module")] },

  // ── packages/contracts (may import identifiers from game) ─────────────────
  { from: { element: { type: "contracts" } }, allow: [el("contracts"), el("game")] },

  // ── apps/api ──────────────────────────────────────────────────────────────
  { from: { element: { type: "api-shared" } }, allow: [el("api-shared"), el("contracts"), el("game")] },
  {
    from: { element: { type: "api-module" } },
    allow: [el("api-shared"), el("contracts"), el("game"), entry("api-module")],
  },
  {
    from: { element: { type: "api" } },
    allow: [el("api"), el("api-shared"), el("api-module"), el("contracts"), el("game")],
  },

  // ── apps/web ──────────────────────────────────────────────────────────────
  { from: { element: { type: "web-shared" } }, allow: [el("web-shared"), webConfig, el("contracts"), el("game")] },
  {
    from: { element: { type: "web-feature" } },
    allow: [el("web-shared"), webConfig, el("contracts"), el("game"), entry("web-feature")],
  },
  {
    // Tests may reach into other features (fixtures, i18n dictionaries) and the web test helpers.
    from: { element: { type: "web-feature" }, file: { categories: "test" } },
    allow: [el("web-feature"), el("web")],
  },
  {
    from: { element: { type: "web-app" } },
    allow: [el("web-app"), el("web-shared"), webConfig, el("contracts"), el("game"), el("web"), entry("web-feature")],
  },
  {
    from: { element: { type: "web-app" }, file: { categories: "test" } },
    allow: [el("web-feature")],
  },
  {
    from: { element: { type: "web" } },
    allow: [el("web"), el("web-app"), el("web-shared"), webConfig, el("web-feature"), el("contracts"), el("game")],
  },

  // ── apps/e2e (black box: talks to the app, shares only contracts) ─────────
  { from: { element: { type: "e2e" } }, allow: [el("e2e"), el("contracts")] },
];

/**
 * The web may import only static data from the domain (ids, board layout, option
 * lists) – never rule functions. Type imports are always allowed.
 */
const webAllowedGameValues = [
  "characterIds",
  "weaponIds",
  "roomIds",
  "ROWS",
  "COLS",
  "ROOM_RECTS",
  "CENTER_RECT",
  "DOORS",
  "SECRET_PASSAGES",
  "SEAT_ORDER",
  "START_POSITIONS",
  "CELLS",
  "MAX_ROOM_CARDS",
  "turnTimeLimits",
  "disproveTimeLimits",
  "DEFAULT_ROOM_SETTINGS",
];

export default tseslint.config(
  {
    ignores: [".claude/**", "**/dist/**", "**/node_modules/**", "**/coverage/**", "**/.turbo/**", "**/playwright-report/**", "**/test-results/**"],
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: { parser: tseslint.parser },
    plugins: { boundaries },
    settings: {
      "boundaries/elements": elements,
      "boundaries/files": files,
      "boundaries/legacy-templates": false,
      "import/resolver": {
        typescript: {
          project: ["apps/*/tsconfig.json", "packages/*/tsconfig.json"],
          alwaysTryTypes: true,
          noWarnOnMultipleProjects: true,
        },
      },
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies,
          message:
            "Architecture boundary violated (see docs/game-screens-plan.md §2.1–2.2): import another feature/module only through its index.ts and respect the layer direction.",
        },
      ],
    },
  },
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@mystery-game/game",
              allowImportNames: webAllowedGameValues,
              allowTypeImports: true,
              message:
                "The web may import only static data from @mystery-game/game (ids, board layout, option lists). Rules run on the server; use me.availableActions / me.reachable.",
            },
          ],
        },
      ],
    },
  },
);
