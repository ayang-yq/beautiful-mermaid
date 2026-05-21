# Dark Mode CSS Specificity Pitfall

## The Problem

mmdc's `-C` flag merges the custom CSS file content into the SVG's `<style>` block, but it is placed **before** Mermaid's built-in theme styles.

CSS cascade rule: when two rules both have `!important`, **the one that appears later wins**.

Result: Mermaid's dark theme built-in rules override your custom CSS.

## Specific Behavior

```
<style>
  /* Custom CSS (passed via -C) */
  #my-svg .cluster rect { fill: transparent !important; }  /* ours */
  
  /* Mermaid dark built-in styles */
  #my-svg .cluster rect { fill: hsl(180, 1.6%, 28.4%); }  /* overrides ours! */
  #my-svg .label text { fill: #ccc; }
  #my-svg .node rect { fill: #1f2020; stroke: #ccc; }
</style>
```

Even with the `#my-svg` prefix + `!important`, both sides have them, so the later one wins.

## The Solution

**Post-process the SVG**: inject CSS just before the `</style>` tag (i.e., after the built-in styles).

```python
svg = svg.replace('</style>', our_css + '</style>')
```

See `scripts/postprocess.cjs` for details.

## The classDef `color` Property Pitfall

The `color` property in classDef is converted by Mermaid into high-specificity selectors:
```
classDef client stroke:#c62828,stroke-width:2px,color:#c62828
```
Generates:
```css
#my-svg .client>*{stroke:rgb(198,40,40)!important;color:rgb(198,40,40)!important;}
#my-svg .client span{stroke:rgb(198,40,40)!important;color:rgb(198,40,40)!important;}
#my-svg .client tspan{fill:rgb(198,40,40)!important;}
```

The `.client tspan` selector is more specific than `.label text`, making it difficult to override even with post-processing.

**Conclusion: only use `stroke` in classDef, never `color`. Let the CSS theme fully control text colors.**

## SVG Text Color Dual Properties

SVG text colors require setting both `fill` (SVG native) and `color` (HTML foreignObject):

```css
/* Correct */
#my-svg .label text { fill: #f1f5f9 !important; color: #f1f5f9 !important; }
```

Setting only `color` without `fill` will result in incorrect colors for directly-rendered SVG text.
