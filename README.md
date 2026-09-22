<div align="center">

# 🏭 Hermex Inventory Service
### Warehouse Inventory, GIN Specifications & Stock Compensation

[ **English** ] &nbsp;•&nbsp; [ [Українська](README.ua.md) ] &nbsp;•&nbsp; [ [System Overview](../overview/README.md) ]

<p align="center">
  gRPC Transport (:50053) &bull; PostgreSQL GIN Indexing &bull; Saga Compensating Restock &bull; Prometheus Metrics (:3002)
</p>

</div>

> **Inventory Service** is the warehouse inventory, catalog specs engine, and compensating transaction processor for Hermex.  
> It exposes gRPC methods for catalog retrieval and cart batch validation, indexes hardware attributes using PostgreSQL GIN, and executes reservation/restock logic within the distributed Saga.

---

## 🏛️ Saga Role & Stock Compensation

The service guarantees warehouse inventory consistency and performs automated restock rollbacks when payment fails:

```mermaid
flowchart TD
    RMQ{{"🐇 RabbitMQ"}}
    IS["🏭 Inventory Service"]
    DB[("🐘 inventory_db")]

    RMQ -->|"Consumer order.created"| IS
    IS -->|"Stock balance check"| DB
    
    alt Stock available
        IS -->|"Reserve: stockQuantity - N"| DB
        IS -->|"Publish inventory.reserved"| RMQ
    else Stock depleted
        IS -->|"Publish inventory.failed"| RMQ
    end

    RMQ -->|"Consumer payment.failed"| IS
    IS -->|"Compensate: stockQuantity + N"| DB
    IS -->|"Publish inventory.compensation.completed"| RMQ
```

---

## 📜 gRPC Interface (`inventory.proto`)

```protobuf
syntax = "proto3";

package hermex.inventory;

service InventoryGrpcService {
  rpc GetProducts (GetProductsRequest) returns (GetProductsResponse);
  rpc GetProductById (GetProductByIdRequest) returns (GetProductByIdResponse);
  rpc ValidateCart (ValidateCartRequest) returns (ValidateCartResponse);
}
```

### RPC Methods:
1. **`GetProducts`:** Returns paginated catalog data with filtering (search term, category, price range, `inStockOnly`, sorting).
2. **`GetProductById`:** Fetches comprehensive product data by UUID or SKU, including hardware specifications and gallery photos.
3. **`ValidateCart`:** Performs atomic, non-locking batch verification of cart items:
   - Validates live warehouse balance.
   - Compares expected unit price with current database price (price drift detection).
   - Returns granular line-item statuses: `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`, `PARTIALLY_AVAILABLE`.

---

## 🐘 Domain Model & PostgreSQL GIN Indexing (`inventory_db`)

### 1. Zero-Seed in Production Code
The application source code is completely free of hardcoded mock seed arrays. The database is populated strictly via a pure SQL manifest [`docker/seed-inventory.sql`](../docker/seed-inventory.sql) containing 60 flagship consumer tech products (Apple, Samsung, Asus, Dell, Sony, Keychron, Anker).

### 2. Entity Structure (`ProductEntity`)
- `id`: UUID (Primary Key)
- `sku`: String (Unique SKU)
- `name`: String (Product commercial title)
- `category`: String (`smartphones`, `laptops`, `audio`, `wearables`, `keyboards`, `powerbanks`)
- `price`: Decimal (Price in UAH)
- `oldPrice`: Decimal (Strikethrough promotion price)
- `stockQuantity`: Integer (Available warehouse stock)
- `description`: JSONB (Multilingual object `{ "ua": "...", "en": "..." }`)
- `specs`: JSONB (Hardware attributes: `cpu`, `ram`, `storage`, `screen`, `gpu`, `color`)
- `imageUrl`: String (Hero thumbnail URL)
- `galleryImages`: Text Array (Multi-angle photo gallery)
- `warrantyMonths`: Integer (Official warranty duration)

### 3. PostgreSQL GIN Index
To support sub-millisecond faceted filtering over dynamic hardware specs:
```sql
CREATE INDEX idx_products_specs_gin ON products USING GIN (specs);
```

---

## 📊 Telemetry & Prometheus Metrics

Initialized as a **NestJS Hybrid Application**:
- gRPC port: `:50053`
- Prometheus metrics port: `:3002/metrics`
- Key Metrics:
  - `hermex_inventory_operations_total` (total reservation and restock events)
  - `hermex_inventory_stock_quantity` (stock levels per SKU gauge)

---

## ⚙️ Environment Variables (`.env`)

| Variable | Type | Default | Description |
| :--- | :---: | :---: | :--- |
| `GRPC_PORT` | number | `50053` | gRPC listening port |
| `METRICS_PORT` | number | `3002` | Metrics port |
| `DB_HOST` | string | `localhost` | PostgreSQL host |
| `DB_PORT` | number | `5432` | PostgreSQL port |
| `DB_USERNAME` | string | `hermex` | Database user |
| `DB_PASSWORD` | string | `hermex_secret_pwd`| Database password |
| `DB_DATABASE` | string | `inventory_db` | Inventory database name |
| `RABBITMQ_URL` | string | `amqp://...` | RabbitMQ connection URL |

---

## 🛠️ Run & Deployment

```bash
# Install dependencies
bun install

# Start development mode
bun run start:dev

# Launch containerized service
docker compose up -d --build
```
