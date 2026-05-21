# Gantt Chart & State Diagram Syntax Reference

## Gantt Chart (gantt)

```mermaid
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    axisFormat %m/%d

    section Phase 1
    Research     :a1, 2026-01-01, 30d
    Design       :a2, after a1, 20d

    section Phase 2
    Development  :active, a3, after a2, 45d
    Testing      :a4, after a3, 15d

    section Milestones
    Kickoff      :milestone, m1, 2026-01-01, 0d
    Launch       :milestone, m2, after a4, 0d
```

### Task Status

| Syntax | Status |
|--------|--------|
| (default) | Normal |
| `active` | In progress |
| `done` | Completed |
| `crit` | Critical path |

### Date Format

| Placeholder | Meaning |
|-------------|---------|
| `YYYY` | Four-digit year |
| `MM` | Month |
| `DD` | Day |
| `MMM` | Abbreviated month (Jan) |

### Task Definition Styles

```
Task Name  :ID, start date, duration in days
Task Name  :ID, after predecessor ID, duration in days
Task Name  :ID, start date, end date
```

---

## State Diagram (stateDiagram-v2)

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : submit
    Processing --> Success : ok
    Processing --> Failed : error
    Success --> Idle : reset
    Failed --> Idle : retry

    state Processing {
        [*] --> Validating
        Validating --> Executing
        Executing --> Done
        Done --> [*]
    }

    state ForkState <<fork>>
    state JoinState <<join>>
    Idle --> ForkState
    ForkState --> TaskA
    ForkState --> TaskB
    TaskA --> JoinState
    TaskB --> JoinState
    JoinState --> Done2
```

### State Types

| Syntax | Meaning |
|--------|---------|
| `[*]` | Start / end state |
| `state Name { }` | Composite state (nested) |
| `<<fork>>` | Fork (parallel) |
| `<<join>>` | Join (parallel) |
| `<<choice>>` | Choice point |

### Transition Syntax

```
StateA --> StateB : event [guard] / action
```

- event: triggering event
- [guard]: guard condition (optional)
- /action: action to execute (optional)

### Notes

```
note right of Idle: Waiting for user action
note left of Processing: Processing
```

## Best Practices

1. Gantt charts: no more than 6 sections, no more than 20 tasks total
2. State diagrams: place start state top-left, end state bottom-right
3. State diagrams: keep nesting to 3 levels or fewer
4. Gantt charts: use `after` to link dependencies; avoid hardcoding dates
