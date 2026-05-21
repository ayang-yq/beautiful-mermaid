# Beautiful Mermaid

Production-quality Mermaid diagram generation toolkit with CSS themes, SVG post-processing, and Puppeteer PNG export.

## What It Does

Write Mermaid declarative text → `mmdc` renders SVG → CSS injection + node size uniforming → Puppeteer exports high-DPI PNG.

## Features

- **4 Built-in Themes**: Elegant (white), Dark Pro, Tech Blue, Warm Pro
- **SVG Post-processing**: CSS injection for reliable dark mode + uniform node rect sizes per category
- **High-DPI PNG Export**: Puppeteer-based SVG→PNG (supports foreignObject/Chinese text)
- **Syntax References**: Flowchart, sequence, ER, class, Gantt, state, + 14 specialized chart types
- **Pattern Library**: 9 ready-to-use templates (RAG, microservices, CI/CD, auth, etc.)

## Quick Start

### Prerequisites

```bash
npm install -g @mermaid-js/mermaid-cli   # mmdc CLI
npx puppeteer browsers install chrome     # for svg2png
```

### Render a Diagram (3 steps)

```bash
# 1. mmdc → SVG
mmdc -i diagram.mmd -o diagram.svg -t default -b white

# 2. CSS inject + uniform node sizes
node scripts/postprocess.cjs diagram.svg assets/elegant.css

# 3. SVG → PNG (2x resolution)
node scripts/svg2png.cjs diagram.svg diagram.png 2
```

### Theme Switching

| Theme | CSS File | mmdc Args |
|-------|----------|-----------|
| Elegant (default) | `assets/elegant.css` | `-t default -b white` |
| Dark Pro | `assets/dark-pro.css` | `-t dark -b '#0f172a'` |
| Tech Blue | `assets/tech-blue.css` | `-t default -b white` |
| Warm Pro | `assets/warm-pro.css` | `-t default -b white` |

## Key Design Decisions

- **classDef**: Use only `stroke` + `fill`, never `color` (breaks dark mode text)
- **Dark mode strategy**: Keep classDef's light fill, switch text to dark color — universal, no per-class hardcoding
- **No SVG coordinate post-processing**: dagre coordinates are globally coupled; any manual alignment causes overlap
- **Puppeteer for PNG**: cairosvg doesn't support foreignObject (Chinese text lost)
- **Post-process CSS injection**: mmdc's `-C` flag has CSS specificity issues in dark mode

## File Structure

```
├── SKILL.md                          # Main documentation
├── assets/
│   ├── elegant.css                   # Default white theme
│   ├── dark-pro.css                  # Dark theme
│   ├── tech-blue.css                 # Blue tech theme
│   └── warm-pro.css                  # Warm business theme
├── scripts/
│   ├── postprocess.cjs              # CSS inject + node size uniforming
│   ├── svg2png.cjs                   # Puppeteer SVG→PNG
│   └── validate-mermaid.cjs           # Syntax validation
└── references/
    ├── syntax-flowchart.md           # Flowchart syntax
    ├── syntax-sequence.md            # Sequence diagram syntax
    ├── syntax-er-class.md            # ER & class diagram syntax
    ├── syntax-gantt-state.md         # Gantt & state diagram syntax
    ├── syntax-specialized.md         # 14 specialized chart types
    ├── patterns.md                   # Common scenario templates
    ├── themes.md                     # Theme customization guide
    └── css-dark-mode-pitfall.md      # Dark mode CSS pitfall
```

## License

MIT
