---
name: Civil Engineering & Construction Operations Dashboard
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0d1c2f'
  on-tertiary-container: '#76859b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#d5e3fd'
  tertiary-fixed-dim: '#b9c7e0'
  on-tertiary-fixed: '#0d1c2f'
  on-tertiary-fixed-variant: '#3a485c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  status-normal-bg: '#ECFDF5'
  status-normal-border: '#A7F3D0'
  status-normal-text: '#065F46'
  status-normal-dot: '#059669'
  status-caution-bg: '#FFFBEB'
  status-caution-border: '#FDE68A'
  status-caution-text: '#92400E'
  status-caution-dot: '#D97706'
  status-inspection-bg: '#FEF2F2'
  status-inspection-border: '#FECACA'
  status-inspection-text: '#991B1B'
  status-inspection-dot: '#DC2626'
  status-na-bg: '#F1F5F9'
  status-na-border: '#CBD5E1'
  status-na-text: '#475569'
  status-na-dot: '#64748B'
  surface-canvas: '#F8FAFC'
  surface-card: '#FFFFFF'
  surface-subtle: '#F1F5F9'
  surface-header: '#0F172A'
  border-subtle: '#E2E8F0'
  border-strong: '#CBD5E1'
typography:
  display-kpi:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  table-header:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  table-cell-num:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  table-cell-text:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

### Personality & Tone
The design system establishes an authoritative, precise, and dependable digital workplace engineered for enterprise construction headquarters operations (본사 공무팀). The aesthetic radiates operational rigor, fiscal accuracy, and engineering discipline. It strips away ornamental fluff in favor of high-density information architecture, instant tabular scanability, and uncompromised hierarchy. The user experience fosters immediate decision clarity: identifying delinquent project delays within seconds while maintaining an objective, calm administrative demeanor.

### Design Movement: High-Density Precision B2B SaaS
Drawing from the modern Corporate/Systematic movement coupled with Swiss data density, the system relies on:
- **Structural Grid Discipline**: Strict horizontal and vertical baselines designed for side-by-side metric comparison across 12 simultaneous site streams.
- **Controlled Palette Hierarchy**: Muted, executive slate and deep navy anchors the workspace, allowing high-visibility semantic status signals to guide attention without visual noise.
- **Tabular Precision**: Every fiscal and schedule metric (백만원, %, pp) is anchored by monospaced tabular numerals, eliminating cognitive friction during multi-site audits.
- **Subtle Surface Differentiation**: Crisp 1px structural borders paired with micro-tonal background changes convey grouping without relying on heavy shadows or decorative cards.

## Colors

### Color Strategy & Semantic Hierarchy
The color architecture prioritizes high data density and mission-critical construction auditing:
- **Primary Base (`#0F172A`)**: Anchors primary navigation chrome, top-level KPI metrics, and high-priority headers, ensuring executive weight.
- **Action & Interactive Blue (`#2563EB`)**: Used exclusively for interactive elements, focus states, selected tab states, active rows, and primary export/query triggers.
- **Neutral & Structural Foundations (`#F8FAFC` to `#334155`)**: Slate foundations keep contrast comfortable across prolonged viewing sessions. Canvas sits at `#F8FAFC`, cards at `#FFFFFF`, and structural grid borders at `#E2E8F0`.

### Semantic Status Tokens (Tri-Tier Construction Metric)
Semantic indicators must strictly communicate engineering status based on the schedule variance threshold (`공정차이 = 실제 - 계획`, in percentage points):
1. **정상 (Normal, $\ge 0.0\text{pp}$)**:
   - Dot: `#059669` | Text: `#065F46` | Fill: `#ECFDF5` | Border: `#A7F3D0`
2. **주의 (Caution, $-5.0\text{pp} < \text{diff} < 0.0\text{pp}$)**:
   - Dot: `#D97706` | Text: `#92400E` | Fill: `#FFFBEB` | Border: `#FDE68A`
3. **점검 (Inspection Required, $\le -5.0\text{pp}$)**:
   - Dot: `#DC2626` | Text: `#991B1B` | Fill: `#FEF2F2` | Border: `#FECACA`
4. **계산 불가 (N/A / Missing Baseline)**:
   - Dot: `#64748B` | Text: `#475569` | Fill: `#F1F5F9` | Border: `#CBD5E1`

## Typography

### Implementation Directives
- **Font Stack**: Primary body and headlines utilize Inter with fallbacks to system Hangul fonts (`Pretendard`, `Apple SD Gothic Neo`, `Malgun Gothic`). 
- **Tabular Figures (`tnum`)**: All numeric presentations (financial values in 백만원, variance in pp, percentages in %) must activate OpenType tabular numbers (`font-feature-settings: "tnum" 1, "cv05" 1`). This ensures decimal points and column widths align vertically across all rows in table and card layouts.
- **Metric Formatting**: Units (`백만원`, `%`, `pp`) are set at 11px-12px in `#64748B` with a 2px left margin, positioned on the baseline of the value.
- **Hierarchy Rules**: Display KPI sizes are reserved exclusively for the top single-row consolidated summary banner. Table header text must be uppercase/compact with zero line overflow.

## Layout & Spacing

### Layout Architecture
- **Target Display**: Optimized for desktop PC environments (1920x1080 and 1440x900 standard enterprise workstation viewports).
- **App Shell Structure**: 
  - Fixed top utility chrome (height: `56px`) with breadcrumb and workspace context.
  - Sticky control ribbon (height: `52px`) housing global filters (Year/Month, Region, Construction Type, Site Selector) and quick CSV export actions.
  - Main workspace: A fluid 12-column analytical dashboard with a 24px outer margin (`margin`) and 16px column gutter (`gutter`).
- **Vertical Rhythm**: High density with zero dead space. Card internal padding is tightly constrained to `12px` or `16px` (`space-md` or `space-lg`). Table row heights are locked to `40px` for standard rows and `36px` for dense views.

## Elevation & Depth

### Surface Philosophy: Structural Borders Over Ambient Shadows
To maintain an enterprise-grade technical dashboard aesthetic, elevation avoids soft consumer-style floating shadows. Depth is achieved through crisp borders and subtle tonal layering:

1. **Base Canvas (`Level 0`)**: `#F8FAFC`. Background for the entire application canvas.
2. **Surface Container (`Level 1`)**: `#FFFFFF` background with a crisp `1px solid #E2E8F0` border. Applied to KPI panels, ranking lists, and data tables.
3. **Card Shadow**: Micro-elevation only (`box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04)`).
4. **Interactive Hover**: Transition border to `#CBD5E1` and micro-elevation (`box-shadow: 0 2px 4px 0 rgba(15, 23, 42, 0.06)`).
5. **Selected / Highlighted Row**: `#EFF6FF` background with an inset left accent bar `3px solid #2563EB`.
6. **Popovers, Dropdowns & Modals (`Level 2`)**: `#FFFFFF`, `1px solid #CBD5E1`, elevated with `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)`.

## Shapes

### Geometry Strategy
The design system adopts a soft, compact corner radius (`roundedness: 1`) to retain an engineered, reliable enterprise appearance:
- **Base Components**: Input fields, select dropdowns, action buttons, and small badge pills use `4px` (`rounded-sm` / `0.25rem`).
- **Cards & Data Tables**: Containers and dashboard panels use `6px` or `8px` (`rounded-md` / `rounded-lg`).
- **Status Badges & Chips**: Compact badges employ `4px` rounding rather than fully rounded pills to match the technical grid structure.

## Components

### 1. Global KPI Banner (Top Single Row)
- **Structure**: A horizontal 4-metric strip at the top of the summary screen displaying:
  1. 기성률 (Cumulative Billing Rate, %)
  2. 계획 공정률 (Planned Progress, %)
  3. 실제 공정률 (Actual Progress, %)
  4. 공정차이 (Variance, pp)
- **Style**: Contained within a single white card container with vertical 1px divider lines (`#E2E8F0`) between metrics. Tabular bold values (`display-kpi`) with neutral secondary unit labels.

### 2. Status Badges & Chips
- **Dimensions**: Height `22px`, horizontal padding `6px`, font size `11px`, font weight `600`.
- **States**:
  - `정상`: Fill `#ECFDF5`, Border `#A7F3D0`, Text `#065F46`, prefix dot `6px` in `#059669`.
  - `주의`: Fill `#FFFBEB`, Border `#FDE68A`, Text `#92400E`, prefix dot `6px` in `#D97706`.
  - `점검`: Fill `#FEF2F2`, Border `#FECACA`, Text `#991B1B`, prefix dot `6px` in `#DC2626`.
  - `계산 불가`: Fill `#F1F5F9`, Border `#CBD5E1`, Text `#475569`, prefix dot `6px` in `#64748B`.

### 3. Delinquency Priority Ranking List (점검 현장 순위)
- **Visual Design**: Ranked list sorted by worst progress variance ($\le -5.0\text{pp}$ first).
- **Row Component**:
  - Left: Site identifier tag (e.g., `D 김포 공동주택`) in `#0F172A` semi-bold.
  - Middle: Inline metric cluster (계획 XX.X% · 실제 XX.X% · 기성률 XX.X%).
  - Right: High-prominence variance pill (e.g., `-10.7pp`) styled with `status-inspection` tokens.
  - Interaction: Hover row triggers background tint `#F8FAFC`. Click triggers instant smooth scroll to the Master Comparison Table, highlights row in `#EFF6FF`, and auto-expands the situation/countermeasure drawer.

### 4. Site Comparison Data Table (현장별 비교표)
- **Header**: Height `36px`, background `#F8FAFC`, bottom border `2px solid #E2E8F0`. Column headers are right-aligned for numeric fields and left-aligned for categorical text.
- **Row Anatomy**: Standard row height `40px`. Borders are `1px solid #F1F5F9`. Alternating row hover state `#F8FAFC`.
- **Expandable Detail Drawer**:
  - Background `#F8FAFC` inset within the table row.
  - 3-column micro-grid: 공사기간 (Contract Duration), 기록된 상황 (Recorded Site Delay Reason), and 계획된 대응 (Planned Countermeasure).

### 5. AI Evidence Drawer & Query Panel (AI에게 묻기)
- **Context Banner**: Active filter indicators (기준 월, 대상 현장, 집계 범위) rendered at the top of the AI response card.
- **Response Layout**: Dual-card structure. Top card provides synthesized explanation distinguishing between "기록된 상황" and "계획된 대응". Bottom metadata strip explicitly lists exact ground-truth source fields referenced.
- **Fallback / Empty States**:
  - 점검 대상 없음: Centered check icon with `#059669` and copy "선택한 범위에 점검이 필요한 현장이 없습니다".
  - 계산 불가 / 자료 없음: Slate pill `#F1F5F9` with explanatory tooltip explaining missing prior-month baseline.

### 6. Filter Toolbar & Form Controls
- **Select Inputs**: Compact height `32px`, border `1px solid #CBD5E1`, background `#FFFFFF`, font size `13px`. Focused state outline `2px solid #2563EB` with zero blur offset.
- **Buttons**:
  - Primary (CSV Export, Run Analysis): Height `32px`, background `#0F172A`, text `#FFFFFF`, border-radius `4px`. Hover `#1E293B`.
  - Secondary (Filter Reset, Preview): Height `32px`, background `#FFFFFF`, border `1px solid #CBD5E1`, text `#334155`. Hover `#F8FAFC`.