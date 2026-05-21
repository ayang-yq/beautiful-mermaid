# Mermaid CSS Theme Detailed Reference

## Design Specification

User-preferred visual style:
- **Transparent subgraph backgrounds**: `fill: transparent`, dashed borders to mark boundaries
- **Rounded node corners**: `rx:8 ry:8`
- **Straight line bends**: `curve: "linear"` in config, `stroke-linejoin: round` in CSS
- **Mixed fonts**: sans-serif (Chinese-first) for nodes/subgraphs, monospace for edge labels
- **Nodes colored via classDef stroke only** — do not use `fill` (let theme control background) or `color` (let theme control text)

## Rendering Pipeline

```
.mmd → mmdc(generate SVG) → postprocess.cjs(inject CSS + uniform node rects) → svg2png.cjs(Puppeteer PNG 2x)
```

Do not use mmdc to output PNG directly — dark mode CSS will not take effect.
Do not use cairosvg for PNG — no foreignObject support, Chinese text lost.

## Usage

```bash
# Step by step
mmdc -i diagram.mmd -o diagram.svg -t default -b white
node scripts/postprocess.cjs diagram.svg assets/elegant.css
node scripts/svg2png.cjs diagram.svg diagram.png 2
```

## Built-in Themes

| Theme | File | Use Case |
|-------|------|----------|
| **Elegant** (default recommended) | `assets/elegant.css` | General purpose, white background, transparent subgraphs |
| **Dark Pro** | `assets/dark-pro.css` | Dark backgrounds, use with `-t dark -b '#0f172a'` |
| **Tech Blue** | `assets/tech-blue.css` | Technical presentations/docs, blue palette |
| **Warm Pro** | `assets/warm-pro.css` | Business reports, warm color palette |

## Key CSS Selectors (must use `#my-svg` prefix)

```css
/* Global root font */
#my-svg { font-family: ... !important; }

/* Node shapes */
#my-svg .node rect,
#my-svg .node polygon,
#my-svg .node circle { rx: 8 !important; ry: 8 !important; }

/* Subgraphs: transparent + dashed border */
#my-svg .cluster rect {
  rx: 14 !important; ry: 14 !important;
  fill: transparent !important;
  stroke: #cbd5e1 !important;
  stroke-dasharray: 6 3 !important;
}

/* Subgraph labels: set both fill and color */
#my-svg .cluster-label text,
#my-svg .cluster-label span { fill: #475569 !important; color: #475569 !important; }

/* Node text: set both fill and color */
#my-svg .label text,
#my-svg .label span,
#my-svg .node .label text { fill: #1e293b !important; color: #1e293b !important; }

/* Edge labels: monospace font */
#my-svg .edgeLabel text,
#my-svg .edgeLabel span { font-family: monospace !important; }

/* Connection lines: straight + rounded bends */
#my-svg .edgePath .path {
  stroke-linejoin: round !important;
}

/* Arrowheads */
#my-svg .marker path { fill: ... !important; stroke: ... !important; }
```

## Inline Styles (classDef)

Only use `stroke`, not `fill` or `color`:

```
classDef client stroke:#c62828,stroke-width:2px
classDef gateway stroke:#e65100,stroke-width:2px
classDef service stroke:#1565c0,stroke-width:2px
classDef data stroke:#7b1fa2,stroke-width:2px
classDef monitor stroke:#2e7d32,stroke-width:2px
```

## Font Stacks

```css
/* Sans-serif (node/subgraph labels) */
font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans SC", "WenQuanYi Zen Hei", system-ui, sans-serif;

/* Monospace (edge labels / API paths) */
font-family: "JetBrains Mono", "Fira Code", "SF Mono", "Cascadia Code", "Consolas", monospace;
```

## Font Sizes

| Element | Size |
|---------|------|
| Global root | 16px (Mermaid default) |
| Subgraph labels | 14px |
| Node labels | 13px |
| Edge labels | 11px |

## Important Notes

- Dark themes must specify both `-t dark` and the corresponding background color `-b '#0f172a'`
- CSS selectors must include the `#my-svg` prefix (to increase specificity and override Mermaid's built-in styles)
- SVG text colors must set both `fill` and `color`
- **Never** use the `color` property in classDef
- **Never** add fill colors to subgraphs (`fill: transparent`)
