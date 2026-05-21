# Common Diagram Pattern Library

For the following high-frequency scenarios, reference the corresponding pattern structure directly — no need to design nodes and edges from scratch.

---

## RAG Pipeline

```mermaid
flowchart LR
    Q["用户查询"] --> Emb["Embedding<br/>向量化"]
    Emb --> VS["Vector Store<br/>语义检索"]
    VS --> Ret["Retrieved Chunks"]
    Ret --> Aug["Augmented Prompt<br/>上下文注入"]
    Aug --> LLM["LLM<br/>生成回答"]
    LLM --> A["回答输出"]
```

**Use case**: RAG systems, knowledge base Q&A

---

## Agentic RAG

```mermaid
flowchart TD
    Q["用户查询"] --> Plan["Query Planner"]
    Plan --> Search["Search Tool"]
    Plan --> Calc["Calculator Tool"]
    Plan --> Code["Code Tool"]
    Search --> Synth["Synthesizer"]
    Calc --> Synth
    Code --> Synth
    Synth --> LLM["LLM Reasoning"]
    LLM -->|需要更多信息| Plan
    LLM -->|回答完整| A["输出"]
```

**Use case**: AI Agents with tool calling

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant AS as Auth Server
    participant RS as Resource Server

    U->>C: 登录请求
    C->>AS: POST /auth/token
    activate AS
    AS-->>C: JWT Token
    deactivate AS
    C->>RS: GET /resource (Bearer Token)
    activate RS
    RS->>AS: 验证Token
    AS-->>RS: Valid
    RS-->>C: 200 OK + Data
    deactivate RS
    C-->>U: 显示结果
```

**Use case**: OAuth/JWT authentication flows

---

## Microservice Architecture

```mermaid
flowchart TB
    subgraph Client["客户端"]
        Web["Web App"]
        Mobile["Mobile App"]
    end

    subgraph Gateway["API Gateway"]
        GW["Nginx / Kong"]
        Auth["Auth Service"]
    end

    subgraph Services["业务服务"]
        User["User Service"]
        Order["Order Service"]
        Pay["Payment Service"]
    end

    subgraph Data["数据层"]
        DB[(PostgreSQL)]
        Cache[(Redis)]
        MQ["Message Queue"]
    end

    Web --> GW
    Mobile --> GW
    GW --> Auth
    GW --> User
    GW --> Order
    GW --> Pay
    User --> DB
    Order --> DB
    Order --> MQ
    Pay --> MQ
    User --> Cache
```

**Use case**: System architecture overview

---

## CI/CD Pipeline

```mermaid
flowchart LR
    Dev["开发者Push"] --> Build["Build"]
    Build --> Test["单元测试"]
    Test --> Lint["代码检查"]
    Lint --> Scan["安全扫描"]
    Scan -->|通过| Stage["Staging部署"]
    Scan -->|失败| Notify["通知开发者"]
    Stage --> E2E["E2E测试"]
    E2E -->|通过| Prod["Production部署"]
    E2E -->|失败| Rollback["自动回滚"]
```

**Use case**: DevOps workflows

---

## Data Flow (ETL)

```mermaid
flowchart LR
    subgraph Source["数据源"]
        S1["API"]
        S2["数据库"]
        S3["文件"]
    end

    Source --> Extract["Extract<br/>抽取"]
    Extract --> Transform["Transform<br/>转换清洗"]
    Transform --> Load["Load<br/>加载"]
    Load --> DW[(Data Warehouse)]
    DW --> BI["BI Dashboard"]
    DW --> ML["ML Pipeline"]
```

**Use case**: Data processing pipelines

---

## Decision Matrix (Quadrant Chart)

```mermaid
quadrantChart
    title 技术选型评估
    x-axis 复杂度低 --> 复杂度高
    y-axis 价值低 --> 价值高
    quadrant-1 优先做
    quadrant-2 规划做
    quadrant-3 可选做
    quadrant-4 快速做
    方案A: [0.3, 0.8]
    方案B: [0.7, 0.9]
    方案C: [0.5, 0.4]
    方案D: [0.2, 0.3]
```

**Use case**: Technology selection, priority ranking

---

## Project Schedule (Gantt Chart)

```mermaid
gantt
    title 项目排期
    dateFormat YYYY-MM-DD

    section 设计
    需求分析    :a1, 2026-06-01, 7d
    原型设计    :a2, after a1, 5d
    技术方案    :a3, after a2, 3d

    section 开发
    后端开发    :a4, after a3, 14d
    前端开发    :a5, after a3, 14d
    联调        :a6, after a4, 5d

    section 上线
    测试        :crit, a7, after a6, 7d
    灰度发布    :a8, after a7, 3d
    全量上线    :milestone, after a8, 0d
```

**Use case**: Project management, milestone planning

---

## ER Diagram (Database Design)

```mermaid
erDiagram
    USER ||--o{ ORDER : "places"
    ORDER ||--|{ ORDER_ITEM : "contains"
    PRODUCT ||--o{ ORDER_ITEM : "included in"
    ORDER }o--|| PAYMENT : "paid by"

    USER {
        int id PK
        string name
        string email UK
    }
    ORDER {
        int id PK
        int user_id FK
        date created_at
        string status
    }
    ORDER_ITEM {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
    }
    PRODUCT {
        int id PK
        string name
        float price
    }
    PAYMENT {
        int id PK
        int order_id FK
        float amount
        string method
    }
```

**Use case**: Database schema design

---

## Usage Guide

1. Find the most matching scenario pattern
2. Copy the structure, replace node names and labels
3. Add or remove nodes as needed
4. Choose an appropriate diagram direction (TD/LR)
