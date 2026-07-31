# Graph Report - .  (2026-07-30)

## Corpus Check
- 264 files · ~135,153 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1253 nodes · 1931 edges · 90 communities (66 shown, 24 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Admin Auth
- Design System
- Design Generate
- Design System
- Design System
- Search Design
- Route Ticket
- Package Dependencies
- Package Devdependencies
- Design System
- Page Auth
- Compress Caveman
- Config Styling
- Tsconfig Compileroptions
- Html Design
- Validate Caveman
- Design Logo
- Kurir Pickup
- Generate Slide
- Styling Tailwind
- Design System
- Config Styling
- Design System
- Background Design
- Shadcn Styling
- Generate Icon
- Design System
- Shadcn Styling
- Components Utils
- Admin Prices
- Brand Extract
- Brand Validate
- Shadcn Styling
- Admin Routes
- Routemap Admin
- Admin Schedules
- Design System
- Config Styling
- Brand Inject
- Tokens Design
- Styling Shadcn
- Search Detect
- Types Supabase
- Generate Logo
- Design System
- Design System
- Design System
- Config Styling
- Aichatwidget Components
- Brand Sync
- Design System
- Init Score
- Styling Tailwind
- Design System
- Nasabah Page
- Design System
- Design System
- Couriermap Components
- Layout Geistmono
- Proxy Utils
- Design System
- Design System
- Design System
- Couriernav Kurir
- Qrscanner Kurir
- Brand Sync
- Design System
- Styling Shadcn
- Caveman Compress
- Styling Shadcn
- Styling Shadcn
- Styling Shadcn
- Styling Shadcn
- Styling Shadcn
- Styling Tailwind
- Styling Tailwind
- Styling Tailwind
- Config Styling
- Config Styling
- Config Styling
- Config Styling
- Styling Tailwind
- Config Styling
- Styling Tailwind
- Eslint Config
- Next Config
- Config Postcss

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 71 edges
2. `TailwindConfigGenerator` - 58 edges
3. `TestTailwindConfigGenerator` - 35 edges
4. `ShadcnInstaller` - 34 edges
5. `TestShadcnInstaller` - 26 edges
6. `compilerOptions` - 16 edges
7. `color` - 15 edges
8. `successResponse` - 15 edges
9. `validate()` - 14 edges
10. `handleApiError()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --references--> `@google/generative-ai`  [EXTRACTED]
  src/app/api/ai/chat/route.ts → package.json
- `TestShadcnInstaller` --uses--> `ShadcnInstaller`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_shadcn_add.py → .agents/skills/ui-styling/scripts/shadcn_add.py
- `TestGeneratedConfigIsValidJs` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .agents/skills/ui-styling/scripts/tailwind_config_gen.py
- `TestTailwindConfigGenerator` --uses--> `TailwindConfigGenerator`  [INFERRED]
  .agents/skills/ui-styling/scripts/tests/test_tailwind_config_gen.py → .agents/skills/ui-styling/scripts/tailwind_config_gen.py
- `DashboardPage()` --calls--> `createClient()`  [EXTRACTED]
  src/app/(nasabah)/dashboard/page.tsx → src/utils/supabase/server.ts

## Import Cycles
- None detected.

## Communities (90 total, 24 thin omitted)

### Community 0 - "Admin Auth"
Cohesion: 0.06
Nodes (39): saveWarehouseLocation(), WarehouseLocationSchema, WarehouseSettingsPage(), WarehouseClient(), inviteStaff(), InviteStaffSchema, InviteStaffState, initialInviteStaffState (+31 more)

### Community 1 - "Design System"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 2 - "Design Generate"
Cohesion: 0.07
Nodes (42): BM25, detect_domain(), get_cip_brief(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection (+34 more)

### Community 3 - "Design System"
Cohesion: 0.04
Nodes (48): $type, $value, background, destructive, destructive-foreground, foreground, muted, muted-foreground (+40 more)

### Community 4 - "Design System"
Cohesion: 0.06
Nodes (45): $type, $value, $type, $value, bg, fg, font-size, hover-bg (+37 more)

### Community 5 - "Search Design"
Cohesion: 0.09
Nodes (36): format_context(), format_result(), main(), Format a single search result for display, Format contextual recommendations for display., BM25, calculate_pattern_break(), detect_domain() (+28 more)

### Community 6 - "Route Ticket"
Cohesion: 0.13
Nodes (25): CreateAddressSchema, GET(), POST(), POST(), POST(), GET(), PATCH(), GET() (+17 more)

### Community 7 - "Package Dependencies"
Cohesion: 0.05
Nodes (37): chart.js, embla-carousel-react, @google/generative-ai, html5-qrcode, lucide-react, maplibre-gl, nanoid, next (+29 more)

### Community 8 - "Package Devdependencies"
Cohesion: 0.06
Nodes (35): eslint, eslint-config-next, eslint-config-prettier, eslint-plugin-prettier, devDependencies, eslint, eslint-config-next, eslint-config-prettier (+27 more)

### Community 9 - "Design System"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 10 - "Page Auth"
Cohesion: 0.12
Nodes (18): AdminDashboard(), AdminLayout(), GET(), login(), logout(), signup(), OnboardingLayout(), PasswordSchema (+10 more)

### Community 11 - "Compress Caveman"
Cohesion: 0.12
Nodes (27): main(), print_usage(), backup_dir_for(), build_compress_prompt(), build_fix_prompt(), call_claude(), compress_file(), is_sensitive_path() (+19 more)

### Community 12 - "Config Styling"
Cohesion: 0.07
Nodes (15): Test adding colors multiple times., Test adding full color palette., Test adding custom breakpoints., Test TailwindConfigGenerator class., Test generating TypeScript configuration., Test generating config with plugins., Test validating config with no content paths., Test validating config with empty theme extensions. (+7 more)

### Community 13 - "Tsconfig Compileroptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 14 - "Html Design"
Cohesion: 0.14
Nodes (24): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+16 more)

### Community 15 - "Validate Caveman"
Cohesion: 0.16
Nodes (22): benchmark_pair(), count_tokens(), main(), print_table(), Path, count_bullets(), extract_code_blocks(), extract_headings() (+14 more)

### Community 16 - "Design Logo"
Cohesion: 0.12
Nodes (19): BM25, detect_domain(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results (+11 more)

### Community 17 - "Kurir Pickup"
Cohesion: 0.13
Nodes (17): completePickup(), getTicketDebug(), PickupItem, Category, ClientAddress, materialGroupOrder, materialGroups, PickupPage() (+9 more)

### Community 18 - "Generate Slide"
Cohesion: 0.15
Nodes (19): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+11 more)

### Community 19 - "Styling Tailwind"
Cohesion: 0.10
Nodes (11): Generate Tailwind CSS configuration files., Add full color palette (50-950 shades) for a base color. Args: name: Color name…, TailwindConfigGenerator, Test adding custom fonts., Test adding custom spacing., Test that adding same plugin twice doesn't duplicate., Test initialization for JavaScript config., Test initialization with different frameworks. (+3 more)

### Community 20 - "Design System"
Cohesion: 0.15
Nodes (18): _detect_page_type(), format_markdown(), format_master_md(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides(), persist_design_system(), Format a page-specific override file with intelligent AI-generated content. (+10 more)

### Community 21 - "Config Styling"
Cohesion: 0.11
Nodes (10): main(), Add custom font families. Args: fonts: Dict of font_type: [font_names] e.g.,…, Add custom spacing values. Args: spacing: Dict of name: value e.g., {'18':…, Add custom breakpoints. Args: breakpoints: Dict of name: width e.g., {'3xl':…, Add plugin requirements. Args: plugins: List of plugin names e.g.,…, Get plugin recommendations based on configuration. Returns: List of recommended…, Generate configuration file content. Returns: Configuration file as string, Write configuration to file. Returns: Tuple of (success, message) (+2 more)

### Community 22 - "Design System"
Cohesion: 0.14
Nodes (11): DesignSystemGenerator, Find matching reasoning rule for a category., Apply reasoning rules to search results., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are…, Bucket a 1-10 dial value into its tier config. Returns None if value is None., Generates design system recommendations from aggregated searches. (+3 more)

### Community 23 - "Background Design"
Cohesion: 0.17
Nodes (17): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+9 more)

### Community 24 - "Shadcn Styling"
Cohesion: 0.12
Nodes (10): Test ShadcnInstaller class., Test adding all components without config., Test adding all components in dry run mode., Create temporary project structure., Test listing installed components when none exist., Test listing installed components when they exist., Test checking for existing shadcn config., Test getting installed components without config. (+2 more)

### Community 25 - "Generate Icon"
Cohesion: 0.20
Nodes (15): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+7 more)

### Community 26 - "Design System"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 27 - "Shadcn Styling"
Cohesion: 0.17
Nodes (8): main(), Add all available shadcn/ui components. Args: overwrite: If True, overwrite…, List installed components. Returns: Tuple of (success, message with component…, Check if shadcn is initialized in project. Returns: True if components.json…, Get list of already installed components. Returns: List of installed component…, Read shadcn version from project package.json; fall back to a pinned default., Add shadcn/ui components. Args: components: List of component names to add…, Tests for shadcn_add.py

### Community 28 - "Components Utils"
Cohesion: 0.21
Nodes (11): DashboardPage(), NewsCarousel(), NewsCarouselProps, NewsSection(), WastePieChart(), WastePieChartProps, CustomItem, extractImage() (+3 more)

### Community 29 - "Admin Prices"
Cohesion: 0.19
Nodes (11): addCategory(), deleteCategory(), updateCategory(), PricesPage(), materialGroupFilterOptions, materialGroupLabels, materialGroupOptions, PriceClient() (+3 more)

### Community 30 - "Brand Extract"
Cohesion: 0.22
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 31 - "Brand Validate"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 32 - "Shadcn Styling"
Cohesion: 0.14
Nodes (8): Handle shadcn/ui component installation., ShadcnInstaller, Test adding components that are already installed., Test initialization with default project root., Test initialization with custom project root., Test checking for non-existent shadcn config., Test getting installed components when none exist., Test getting installed components when files exist.

### Community 33 - "Admin Routes"
Cohesion: 0.27
Nodes (10): assignCourier(), generateOptimalRoutes(), RoutesPage(), Depot, RouteClient(), RouteMap, haversineDistance(), kMeansClustering() (+2 more)

### Community 34 - "Routemap Admin"
Cohesion: 0.19
Nodes (13): addRouteLayer(), clearRouteLayers(), Courier, COURIER_COLORS, courierColor(), Depot, fetchRoadRoute(), GeoLineString (+5 more)

### Community 35 - "Admin Schedules"
Cohesion: 0.29
Nodes (9): addSchedule(), deleteSchedule(), updateSchedule(), SchedulesPage(), DAYS, Schedule, ScheduleClient(), invalidateCacheAndPath() (+1 more)

### Community 36 - "Design System"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 37 - "Config Styling"
Cohesion: 0.20
Nodes (8): Tests for tailwind_config_gen.py, Reduce a generated TS/JS config to a bare assignable object so it can be handed…, Regression guard for the missing-comma bug between the ``theme`` block and…, The property preceding ``plugins`` must end with a comma (pure-Python check, so…, The emitted config parses as valid JS via ``node --check``., _strip_to_object(), TestGeneratedConfigIsValidJs, parametrize

### Community 38 - "Brand Inject"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 39 - "Tokens Design"
Cohesion: 0.20
Nodes (9): args, extractTokens(), fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath (+1 more)

### Community 40 - "Styling Shadcn"
Cohesion: 0.18
Nodes (6): Test adding components with overwrite flag., Test successful component addition., Test component addition with subprocess error., Test component addition when npx is not found., Test successful addition of all components., patch

### Community 41 - "Search Detect"
Cohesion: 0.25
Nodes (10): detect_domain(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search stack-specific guidelines, search() (+2 more)

### Community 42 - "Types Supabase"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 43 - "Generate Logo"
Cohesion: 0.29
Nodes (9): enhance_prompt(), generate_batch(), generate_logo(), load_env(), main(), Enhance the logo prompt with style and industry modifiers, Generate a logo using Gemini models with image generation Args: aspect_ratio:…, Generate multiple logo variants with different styles (+1 more)

### Community 44 - "Design System"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 45 - "Design System"
Cohesion: 0.20
Nodes (10): fast, normal, slow, $type, $value, $type, $value, duration (+2 more)

### Community 46 - "Design System"
Cohesion: 0.24
Nodes (10): $type, $value, $type, $value, primitive, radius, shadow, full (+2 more)

### Community 47 - "Config Styling"
Cohesion: 0.22
Nodes (6): Path, Initialize generator. Args: typescript: If True, generate .ts config, else .js…, Determine default output path., Create base configuration structure., Get default content paths for framework., Any

### Community 48 - "Aichatwidget Components"
Cohesion: 0.24
Nodes (6): AiChatWidget(), ChatMessage, genId(), MarkdownText(), renderMarkdown(), SUGGESTED_PROMPTS

### Community 49 - "Brand Sync"
Cohesion: 0.33
Nodes (8): adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale(), main(), path, updateDesignTokens()

### Community 50 - "Design System"
Cohesion: 0.28
Nodes (8): Path, Regression tests for validate-tokens.cjs. The validator used to skip any line…, A hardcoded hex on the same line as a var() token is still a violation., A line that references only tokens produces no false positives., _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation(), CompletedProcess

### Community 51 - "Init Score"
Cohesion: 0.28
Nodes (5): BM25, BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query

### Community 52 - "Styling Tailwind"
Cohesion: 0.29
Nodes (4): Generate TypeScript configuration., Generate JavaScript configuration., Format plugins array for config. Validates each plugin name against a strict…, Add indentation to JSON string.

### Community 53 - "Design System"
Cohesion: 0.25
Nodes (8): ansi_ljust(), format_ascii_box(), hex_to_ansi(), Convert hex color to ANSI True Color swatch (██) with fallback., Like str.ljust but accounts for zero-width ANSI escape sequences., Create a Unicode section separator: ├─── NAME ───...┤, Format design system as Unicode box with ANSI color swatches., section_header()

### Community 54 - "Nasabah Page"
Cohesion: 0.32
Nodes (3): LABEL_PRESETS, LocationPicker(), LocationPickerProps

### Community 55 - "Design System"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 56 - "Design System"
Cohesion: 0.60
Nodes (5): sm, sm, sm, $type, $value

### Community 57 - "Couriermap Components"
Cohesion: 0.50
Nodes (3): CourierDashboard(), CourierMap(), Ticket

### Community 58 - "Layout Geistmono"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 59 - "Proxy Utils"
Cohesion: 0.60
Nodes (3): config, proxy(), createClient()

### Community 60 - "Design System"
Cohesion: 0.67
Nodes (4): $type, $value, default, default

### Community 61 - "Design System"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 62 - "Design System"
Cohesion: 0.67
Nodes (4): $type, $value, md, md

## Knowledge Gaps
- **238 isolated node(s):** `fs`, `path`, `fs`, `path`, `fs` (+233 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Page Auth` to `Admin Auth`, `Admin Routes`, `Admin Schedules`, `Route Ticket`, `Kurir Pickup`, `Couriermap Components`, `Components Utils`, `Admin Prices`, `Couriernav Kurir`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `primitive` connect `Design System` to `Design System`, `Design System`, `Design System`, `Design System`, `Design System`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Package Dependencies` to `Package Devdependencies`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `TailwindConfigGenerator` (e.g. with `TestGeneratedConfigIsValidJs` and `TestTailwindConfigGenerator`) actually correct?**
  _`TailwindConfigGenerator` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `fs`, `path`, `fs` to the rest of the system?**
  _238 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Auth` be split into smaller, more focused modules?**
  _Cohesion score 0.06393442622950819 - nodes in this community are weakly interconnected._
- **Should `Design System` be split into smaller, more focused modules?**
  _Cohesion score 0.05370101596516691 - nodes in this community are weakly interconnected._