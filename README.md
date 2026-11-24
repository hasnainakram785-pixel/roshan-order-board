# Live Order Status Board - Roshan Microfinance

A real-time board for Roshan Microfinance staff to monitor loan application status.
Built with **Laravel** (backend), **MySQL**, and a lightweight front-end, deployed on free hosting.

> **Current stage: Task 1 - Database schema, migrations and seeders.**
> Task 2 (REST API) and Task 3 (live board front-end + deploy) build on this.

## Project plan

| # | Task                                   | Days |
|---|----------------------------------------|------|
| 1 | Create Database Schema and Migrations  | 2    |
| 2 | Implement REST API for Orders          | 2    |
| 3 | Build Live Board Front-end and Deploy  | 2    |

## `orders` table

| Column          | Type                        | Notes                                                        |
|-----------------|-----------------------------|--------------------------------------------------------------|
| `id`            | BIGINT UNSIGNED, PK, auto   | Order / application id                                       |
| `customer_name` | VARCHAR(255)                | Applicant name                                               |
| `amount`        | DECIMAL(12,2)               | Loan amount (decimal, not float, so money stays exact)       |
| `status`        | VARCHAR(30), indexed        | `pending`, `under_review`, `approved`, `disbursed`, `rejected` (default `pending`) |
| `created_at`    | TIMESTAMP, nullable         | Set by Laravel                                               |
| `updated_at`    | TIMESTAMP, nullable         | Set by Laravel                                               |

Files of interest:

- `database/migrations/2026_11_21_000000_create_orders_table.php` - creates the table
- `database/seeders/OrderSeeder.php` - inserts 5 sample orders (one per status)
- `database/seeders/DatabaseSeeder.php` - calls `OrderSeeder`
- `app/Models/Order.php` - Eloquent model with status constants

## Requirements

- PHP 8.2+ and Composer
- MySQL 8 (or MariaDB 10.4+), e.g. via XAMPP / Laragon
- phpMyAdmin or any MySQL client (to verify)
- Git

## Run it locally

```bash
# 1. Clone and install
git clone <your-repo-url> roshan-order-board
cd roshan-order-board
composer install

# 2. Environment
cp .env.example .env
php artisan key:generate
```

Open `.env` and point it at MySQL (see `.env.mysql.example`):

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=roshan_orders
DB_USERNAME=root
DB_PASSWORD=
```

```bash
# 3. Create the (empty) database
mysql -u root -e "CREATE DATABASE roshan_orders CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
#    ...or create `roshan_orders` in phpMyAdmin.

# 4. Create the table and insert the sample data
php artisan migrate --seed
```

To rebuild from scratch at any time: `php artisan migrate:fresh --seed`

## Verify

In phpMyAdmin open `roshan_orders` > `orders`, or run:

```sql
DESCRIBE orders;
SELECT id, customer_name, amount, status FROM orders;
```

You should see the six columns above and 5 rows, one per status.
Or from Laravel: `php artisan tinker` then `App\Models\Order::count();` (returns `5`).

## Sample data

| customer_name | amount     | status       |
|---------------|-----------:|--------------|
| Ayesha Khan   |  50,000.00 | pending      |
| Bilal Ahmed   | 120,000.00 | under_review |
| Fatima Noor   |  75,000.50 | approved     |
| Usman Tariq   | 200,000.00 | disbursed    |
| Sana Malik    |  30,000.00 | rejected     |

## Next

- Task 2: REST endpoints to list, retrieve and update orders
- Task 3: polling live board front-end, deployment scripts and deploy README

## REST API (Task 2)

Start the server, then call the endpoints:

```bash
php artisan migrate --seed   # creates the orders table + 5 sample orders
php artisan serve            # API is at http://127.0.0.1:8000/api/orders
```

| Method      | URL                | What it does                                   | Success |
|-------------|--------------------|------------------------------------------------|---------|
| GET         | `/api/orders`      | List all orders (JSON array). Optional `?status=pending` | 200 |
| GET         | `/api/orders/{id}` | Get one order                                  | 200     |
| PATCH / PUT | `/api/orders/{id}` | Update the order's `status`, returns the updated order | 200 |

**Allowed status values:** `pending`, `under_review`, `approved`, `disbursed`, `rejected`.

### Order JSON

```json
{
  "id": 1,
  "customer_name": "Ayesha Khan",
  "amount": 50000,
  "status": "pending",
  "created_at": "2026-11-21T10:00:00+00:00",
  "updated_at": "2026-11-21T10:00:00+00:00"
}
```

### Examples

```bash
# list all orders
curl http://127.0.0.1:8000/api/orders

# one order
curl http://127.0.0.1:8000/api/orders/1

# update the status
curl -X PATCH http://127.0.0.1:8000/api/orders/1 \
  -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"status":"approved"}'
```

### Errors

| Case                       | Status | Body (example) |
|----------------------------|--------|----------------|
| Order id does not exist    | 404    | `{"message":"No query results for model [App\\Models\\Order] 9999."}` |
| Missing or invalid status  | 422    | `{"message":"The status must be one of: pending, under_review, approved, disbursed, rejected.","errors":{"status":["..."]}}` |

### Test it

- **Postman:** import `docs/OrderBoard.postman_collection.json` (variable `baseUrl` = `http://127.0.0.1:8000`) and send the 7 requests.
- **Automated tests:** `php artisan test` (feature tests in `tests/Feature/OrderApiTest.php`).

### Where the code is

| What | Path |
|------|------|
| Routes | `routes/api.php` |
| Controller (index, show, update) | `app/Http/Controllers/Api/OrderController.php` |
| Status validation | `app/Http/Requests/UpdateOrderStatusRequest.php` |
| Force JSON responses | `app/Http/Middleware/ForceJsonResponse.php` |
