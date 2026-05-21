# Specialized Chart Syntax Reference

## Mind Map (mindmap)

```mermaid
mindmap
  root((Central Topic))
    Branch A
      Sub A1
      Sub A2
    Branch B
      Sub B1
      Sub B2
        Deep B2a
    Branch C
      Sub C1
```

- Auto-layout; no need to specify positions
- Nested indentation represents hierarchy
- More than 4 levels of nesting becomes cramped

---

## C4 Architecture Diagram

```mermaid
C4Context
    title System Context Diagram
    Person(user, "User", "End user")
    System(system, "System", "Core platform")
    System_Ext(ext, "External API", "Third party")
    Rel(user, system, "Uses")
    Rel(system, ext, "Calls")
```

### C4 Levels

| Keyword | Level | Description |
|---------|-------|-------------|
| `C4Context` | L1 System Context | Outermost view |
| `C4Container` | L2 Container | Decompose system internals |
| `C4Deployment` | L3 Deployment | Infrastructure view |

### Element Types

| Type | Syntax |
|------|--------|
| Person | `Person(id, "Name", "Desc")` |
| External Person | `Person_Ext(id, "Name", "Desc")` |
| System | `System(id, "Name", "Desc")` |
| External System | `System_Ext(id, "Name", "Desc")` |
| Container | `Container(id, "Name", "Tech", "Desc")` |
| Component | `Component(id, "Name", "Tech", "Desc")` |
| Database | `ContainerDb(id, "Name", "Tech", "Desc")` |
| Queue | `ContainerQueue(id, "Name", "Tech", "Desc")` |

---

## Sankey (Flow / Fund Direction)

```mermaid
sankey-beta
SourceA,TargetA,60
SourceA,TargetB,25
SourceB,TargetA,15
SourceB,TargetC,40
```

- Format: `source,target,value`
- Width ratios are calculated automatically
- Suitable for: fund flows, energy flows, user conversion

---

## Pie Chart (pie)

```mermaid
pie title Market Share
    "Company A" : 35
    "Company B" : 25
    "Company C" : 20
    "Others" : 20
```

---

## Quadrant Chart (quadrantChart)

```mermaid
quadrantChart
    title Priorities
    x-axis Low Impact --> High Impact
    y-axis Low Effort --> High Effort
    quadrant-1 Do First
    quadrant-2 Schedule
    quadrant-3 Delegate
    quadrant-4 Eliminate
    Task A: [0.8, 0.2]
    Task B: [0.3, 0.7]
    Task C: [0.6, 0.5]
```

Coordinate values range from [0, 1].

---

## User Journey (journey)

```mermaid
journey
    title User Shopping Experience
    section Browse
      Visit homepage: 5: User
      Search product: 4: User
    section Purchase
      Add to cart: 4: User
      Checkout: 3: User, System
    section Post-purchase
      Receive order: 5: User
```

Score 1–5 (1 = bad, 5 = good).

---

## Git Graph (gitGraph)

```mermaid
gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
```

---

## Timeline (timeline)

```mermaid
timeline
    title Project History
    2024-Q1 : Planning : Team formed
    2024-Q2 : Development : MVP ready
    2024-Q3 : Testing : Beta launch
    2024-Q4 : Release : GA
```

---

## Fishbone Diagram (fishbone / Ishikawa)

```mermaid
fishbone
    category "Cause A" ["Reason 1", "Reason 2"]
    category "Cause B" ["Reason 3", "Reason 4"]
    "Problem Statement"
```

---

## Radar Chart (radar)

```mermaid
radar-beta
    title Skill Assessment
    axis "Speed", "Quality", "Cost", "Reliability", "Flexibility"
    curve{Product A: 8, 7, 6, 9, 5}
    curve{Product B: 6, 9, 8, 7, 8}
```

---

## Venn Diagram (venn)

```mermaid
venn
    title Team Skills
    A["Frontend"]
    B["Backend"]
    C["DevOps"]
    A & B["Full Stack"]
    B & C["Infrastructure"]
    A & C["CI/CD"]
    A & B & C["All Rounder"]
```

## Best Practices

1. Mind maps: center topic ≤3 words, branches ≤6
2. C4: one diagram per level, don't mix levels
3. Sankey: clear naming for sources and targets to avoid ambiguity
4. Pie charts: no more than 7 categories
5. Quadrant charts: 3–5 items per quadrant
