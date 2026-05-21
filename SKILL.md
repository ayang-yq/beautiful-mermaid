---
name: mermaid
description: "Generate diagrams with Mermaid declarative syntax — flowcharts, architecture, sequence, Gantt, ER, mindmaps, etc. Write text, auto-layout, no manual coordinates."
version: 6.0.0
author: beautiful-mermaid contributors
dependencies:
  - "@mermaid-js/mermaid-cli (mmdc)"
  - "puppeteer (bundled with mmdc, auto-resolved)"
platforms: [linux, macos, windows]
tags: [mermaid, diagrams, flowchart, sequence, architecture, visualization]
repo: https://github.com/ayang-yq/beautiful-mermaid
---

# Mermaid Diagram Skill v6.0

All-Node.js pipeline: Write Mermaid text → mmdc renders SVG → postprocess.cjs injects CSS → svg2png.cjs converts PNG.

## Prerequisites

```bash
mmdc --version  # 11.15.0+ (bundles puppeteer automatically)
```

## Core Principles

1. Accept dagre's natural layout — no SVG coordinate post-processing
2. Post-processing only does: CSS injection + uniform node rect sizes per category
3. classDef uses only `stroke` + `fill`, never `color` (overrides dark mode text color)

## Never Do

- Post-process move cluster/node/edge coordinates → guaranteed overlap
- mermaid-config.json for curve → deprecated, use default bezier
- cairosvg for PNG → no foreignObject support, text lost
- mmdc `-C` flag for CSS → dark mode priority issue, must post-process inject

## Workflow

1. Determine chart type → load matching references file on demand
2. Write .mmd file → save with write_file
3. Validate syntax → `mmdc -i x.mmd -o /dev/null` (optional)
4. Render → three commands below
5. Report → output path + file size

## Render Commands (3 steps)

```bash
CSS=./assets/elegant.css
SCRIPTS=./scripts

# 1. mmdc → SVG (default bezier, no -c config)
mmdc -i diagram.mmd -o diagram.svg -t default -b white

# 2. CSS inject + uniform node sizes
node $SCRIPTS/postprocess.cjs diagram.svg $CSS

# 3. SVG → PNG (2x, Puppeteer)
node $SCRIPTS/svg2png.cjs diagram.svg diagram.png 2
```

### Theme Switching

| Theme | CSS file | mmdc args |
|-------|----------|-----------|
| Elegant (default) | `elegant.css` | `-t default -b white` |
| Dark Pro | `dark-pro.css` | `-t dark -b '#0f172a'` |
| Tech Blue | `tech-blue.css` | `-t default -b white` |
| Warm Pro | `warm-pro.css` | `-t default -b white` |

## Chart Type → References Mapping

Load on demand, don't read all:

| Type | References file |
|------|-----------------|
| flowchart / graph | `syntax-flowchart.md` |
| sequenceDiagram | `syntax-sequence.md` |
| erDiagram / classDiagram | `syntax-er-class.md` |
| gantt / stateDiagram | `syntax-gantt-state.md` |
| mindmap/C4/Sankey etc. (14 types) | `syntax-specialized.md` |
| Common scenario templates | `patterns.md` |
| CSS theme details | `themes.md` |
| Dark mode CSS priority pitfall | `css-dark-mode-pitfall.md` |

## classDef Rules

```
# Correct: stroke + fill only
classDef client fill:#fce4ec,stroke:#c62828,stroke-width:2px

# Wrong: adding color → overrides dark mode text color
classDef client fill:#fce4ec,stroke:#c62828,stroke-width:2px,color:#c62828
```

Text color is fully controlled by CSS theme. Never set it in classDef.

## Design Specs

- Subgraph background: transparent (CSS sets `fill:transparent`), dashed border
- Nodes: rounded rect `rx:8 ry:8`
- Edges: default bezier curves
- Font: sans-serif Chinese-first stack for nodes/labels, monospace for edge labels

## Dark Mode Color Strategy

Dark mode keeps classDef's light fill, text color switches to dark (`#1e293b`), creating high contrast on the dark canvas background. This is a universal solution — any classDef name auto-adapts, no hardcoding needed.

## Database Nodes Use Cylinders

```mermaid
DB[("MySQL")]     ✅ cylinder
DB["MySQL"]        ❌ rectangle
```

All persistent storage (MySQL, Redis, ES, MQ, OSS, etc.) use `[("...")]` syntax.

## LR Flowcharts: Fewer Subgraphs

In flowchart LR, multiple subgraphs + dashed links + isolated nodes cause dagre layout overlap. Prefer flat nodes (no subgraphs) for linear flows, use classDef colors to distinguish phases.

## Self-Check List

| Issue | Fix |
|-------|-----|
| Dark mode text unreadable | Remove `color` from classDef, confirm postprocess ran |
| Subgraph has opaque fill | Confirm postprocess ran (CSS sets `.cluster rect{fill:transparent}`) |
| Node boxes different sizes | postprocess auto-uniforms same-category rects |
| Isolated subgraph misplaced | dagre puts dashed-only subgraphs in corners; use solid links or merge |
| Arrow crossings | Adjust node declaration order or change direction |
| Chinese garbled | Use double quotes: `A["Chinese text"]` |
| Text overflow | Use `<br/>` for manual line breaks |

## Helper Scripts

| Script | Purpose |
|--------|---------|
| `scripts/postprocess.cjs <svg> <css> [out.svg]` | CSS inject (to end of style block) + uniform node rects (no coordinate moves) |
| `scripts/svg2png.cjs <svg> <png> [scale]` | Puppeteer SVG→PNG (2x default) |
| `scripts/validate-mermaid.cjs <file.mmd>` | Syntax validation (cross-platform Node.js) |

## Output

- Default save to current working directory (or your preferred output path)
- Keep `.mmd` source + `.svg` + `.png`

## Error Recovery

1. 1st failure → fix syntax (unclosed quotes/brackets most common)
2. 2nd failure → simplify chart (reduce nodes, split subgraphs)
3. 3rd failure → stop and ask user

## File Structure

```
mermaid/
  SKILL.md                    ← this file
  assets/
    elegant.css               ← default theme
    dark-pro.css              ← dark theme
    tech-blue.css             ← tech blue theme
    warm-pro.css              ← warm business theme
  scripts/
    postprocess.cjs            ← CSS inject + node size uniforming (Node.js)
    svg2png.cjs               ← Puppeteer PNG conversion
    validate-mermaid.cjs      ← syntax validation (Node.js, cross-platform)
  references/                 ← load on demand
    syntax-flowchart.md
    syntax-sequence.md
    syntax-er-class.md
    syntax-gantt-state.md
    syntax-specialized.md
    patterns.md
    themes.md
    css-dark-mode-pitfall.md
```
