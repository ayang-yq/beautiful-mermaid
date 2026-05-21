# ER Diagram & Class Diagram Syntax Reference

## ER Diagram (erDiagram)

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : "included in"

    CUSTOMER {
        string name PK
        string email UK
        int age
    }
    ORDER {
        int id PK
        date created
        string status
    }
    PRODUCT {
        int id PK
        string name
        float price
    }
```

### Relationship Symbols

| Left | Relationship | Right | Meaning |
|------|-------------|-------|---------|
| `\|` | -- | `\|` | One to one |
| `\|o` | -- | `o\|` | Zero or one |
| `\|{` | -- | `}\|` | One to many |
| `\|o` | -- | `o{` | Zero to many |
| `}\|` | -- | `\|{` | Many to many |

### Attribute Modifiers

- `PK` — Primary Key
- `FK` — Foreign Key
- `UK` — Unique Key

---

## Class Diagram (classDiagram)

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() void
        #sleep() void
    }
    class Dog {
        +String breed
        +fetch() void
    }
    class Swimmable {
        <<interface>>
        +swim() void
    }

    Animal <|-- Dog : extends
    Dog ..|> Swimmable : implements
    Dog --> Toy : plays with
```

### Visibility

| Symbol | Meaning |
|--------|---------|
| `+` | public |
| `-` | private |
| `#` | protected |
| `~` | package |

### Relationship Arrows

| Syntax | Meaning |
|--------|---------|
| `<\|--` | Inheritance (extends) |
| `\|-->\|` | Implementation (implements) |
| `-->` | Association |
| `..>` | Dependency |
| `o--` | Aggregation |
| `*--` | Composition |

### Relationship Labels

```
A --> B : label text
A "1" --> "0..*" B : has
```

### Enums & Abstract Classes

```
class Color {
    <<enumeration>>
    RED
    GREEN
    BLUE
}

class Shape {
    <<abstract>>
    +draw() void
}
```

## Best Practices

1. ER diagrams: draw entities and relationship lines first, then add attributes
2. Class diagrams: place parent classes above, child classes below
3. Don't exceed 8 entities/classes per diagram — split if needed
4. Use verbs for relationship labels: places, contains, belongs_to
