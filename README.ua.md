<div align="center">

# 🏭 Hermex Inventory Service
### Складський облік, GIN-специфікації та компенсація залишків

[ [English](README.md) ] &nbsp;•&nbsp; [ **Українська** ] &nbsp;•&nbsp; [ [Головний огляд](../overview/README.ua.md) ]

<p align="center">
  Транспорт gRPC (:50053) &bull; GIN-індексація PostgreSQL &bull; Компенсація залишків Saga &bull; Метрики Prometheus (:3002)
</p>

</div>

> **Inventory Service** — мікросервіс складського обліку, каталогу електроніки та компенсуючих транзакцій Hermex.  
> Надає gRPC-методи для каталогу та батч-валідації кошика, індексує апаратні специфікації через PostgreSQL GIN та здійснює резервування/повернення залишків у розподіленій Saga.

---

## 🏛️ Роль у Saga та компенсація залишків

Сервіс гарантує актуальність складських залишків та автоматично повертає товар на баланс (Restock) у разі невдалої оплати:

```mermaid
flowchart TD
    RMQ{{"🐇 RabbitMQ"}}
    IS["🏭 Inventory Service"]
    DB[("🐘 inventory_db")]

    RMQ -->|"Consumer order.created"| IS
    IS -->|"Перевірка залишків"| DB
    
    alt Товар є в наявності
        IS -->|"Резерв: stockQuantity - N"| DB
        IS -->|"Publish inventory.reserved"| RMQ
    else Товар закінчився
        IS -->|"Publish inventory.failed"| RMQ
    end

    RMQ -->|"Consumer payment.failed"| IS
    IS -->|"Компенсація: stockQuantity + N"| DB
    IS -->|"Publish inventory.compensation.completed"| RMQ
```

---

## 📜 gRPC Контракт (`inventory.proto`)

```protobuf
syntax = "proto3";

package hermex.inventory;

service InventoryGrpcService {
  rpc GetProducts (GetProductsRequest) returns (GetProductsResponse);
  rpc GetProductById (GetProductByIdRequest) returns (GetProductByIdResponse);
  rpc ValidateCart (ValidateCartRequest) returns (ValidateCartResponse);
}
```

### RPC-методи:
1. **`GetProducts`:** Повертає сторінку каталогу з фільтрами (пошук, категорія, ціновий діапазон, `inStockOnly`, сортування) та пагінацією.
2. **`GetProductById`:** Повні дані про товар за UUID або SKU, включаючи фотогалерею та специфікації.
3. **`ValidateCart`:** Батч-валідація позицій кошика без блокувань:
   - Перевіряє фактичні залишки на складі.
   - Порівнює очікувану ціну з поточною в базі (виявлення змін ціни).
   - Повертає статуси: `IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`, `PARTIALLY_AVAILABLE`.

---

## 🐘 Доменна модель та GIN-індексація (`inventory_db`)

### 1. Принцип Zero-Seed in Production Code
Код очищено від масивів мокових даних. База наповнюється через SQL-скрипт [`docker/seed-inventory.sql`](../docker/seed-inventory.sql), що містить 60 актуальних моделей техніки (Apple, Samsung, Asus, Dell, Sony, Keychron, Anker).

### 2. Структура `ProductEntity`
- `id`: UUID (Primary Key)
- `sku`: String (Унікальний артикул)
- `name`: String (Комерційна назва)
- `category`: String (`smartphones`, `laptops`, `audio`, `wearables`, `keyboards`, `powerbanks`)
- `price`: Decimal (Ціна в гривнях)
- `oldPrice`: Decimal (Закреслена акційна ціна)
- `stockQuantity`: Integer (Кількість на складі)
- `description`: JSONB (Мультимовний об'єкт `{ "ua": "...", "en": "..." }`)
- `specs`: JSONB (Апаратні специфікації: `cpu`, `ram`, `storage`, `screen`, `gpu`, `color`)
- `imageUrl`: String (Головне зображення)
- `galleryImages`: Text Array (Галерея ракурсів)
- `warrantyMonths`: Integer (Офіційна гарантія)

### 3. GIN-індекс PostgreSQL
Для забезпечення фасетної фільтрації за частки мілісекунди:
```sql
CREATE INDEX idx_products_specs_gin ON products USING GIN (specs);
```

---

## 📊 Спостережуваність та метрики Prometheus

Мікросервіс працює як **NestJS Hybrid Application**:
- gRPC порт: `:50053`
- Порт метрик Prometheus: `:3002/metrics`
- Метрики:
  - `hermex_inventory_operations_total` (кількість резервувань та повернень)
  - `hermex_inventory_stock_quantity` (рівень залишків за SKU)

---

## ⚙️ Змінні оточення (`.env`)

| Змінна | Тип | За замовчуванням | Опис |
| :--- | :---: | :---: | :--- |
| `GRPC_PORT` | number | `50053` | Порт gRPC-сервера |
| `METRICS_PORT` | number | `3002` | Порт метрик Prometheus |
| `DB_HOST` | string | `localhost` | Хост PostgreSQL |
| `DB_PORT` | number | `5432` | Порт PostgreSQL |
| `DB_USERNAME` | string | `hermex` | Користувач бази даних |
| `DB_PASSWORD` | string | `hermex_secret_pwd`| Пароль бази даних |
| `DB_DATABASE` | string | `inventory_db` | База даних залишків |
| `RABBITMQ_URL` | string | `amqp://...` | Рядок підключення до RabbitMQ |

---

## 🛠️ Запуск мікросервісу

```bash
# Встановлення залежностей
bun install

# Запуск у режимі розробки
bun run start:dev

# Запуск у Docker Compose
docker compose up -d --build
```
