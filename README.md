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

## Live Board and Deployment (Task 3)

A plain HTML/CSS/JS page (`frontend/`) that polls `GET /api/orders` **every 10 seconds** and shows the loan applications in a colour-coded table. Staff can change a status from the dropdown on each row.

| Status | Colour |
|--------|--------|
| pending | amber |
| under_review | blue |
| approved | green |
| disbursed | teal |
| rejected | red |

**Live URLs:** board = `https://roshan-order-api.site.je/board/` , Netlify copy = `https://roshanorderboard.netlify.app` , API = `https://roshan-order-api.site.je/index.php/api/orders`

### Run it locally

```bash
# terminal 1 - the API
php artisan migrate:fresh --seed
php artisan serve                       # http://127.0.0.1:8000

# terminal 2 - the board
python -m http.server 5500 --directory frontend    # open http://127.0.0.1:5500
```

The API address is set in `frontend/config.js` (`API_BASE_URL`, default `http://127.0.0.1:8000/api`). Tests for the polling logic: `node tests-js/app.test.js`.

### Deploy step by step

**Step 0 - pick a host that allows API calls.** The brief suggests InfinityFree. InfinityFree puts a JavaScript/cookie check in front of every free site, which blocks API requests that come from another website (such as Netlify) and returns an HTML page instead of JSON. Before building anything, test the host: after Part A run `curl -i https://YOUR-API-HOST/api/orders`. If you get JSON, continue. If you get an HTML page mentioning JavaScript, use another free PHP host with MySQL (the brief allows "or similar"), or keep the board and API on the same InfinityFree domain (see Part D).

**Part A - deploy the Laravel API (shared PHP hosting, no SSH)**
1. Create a free hosting account and a site (note its URL, use `https`).
2. In the control panel create a MySQL database; note the host, database name, user and password.
3. In phpMyAdmin open that database and **Import** `deploy/schema.sql` (creates the `orders` table and 5 sample rows; shared hosting cannot run `php artisan migrate`).
4. On your computer, in the Laravel folder, run `bash deploy/build_for_shared_hosting.sh`. It creates `deploy-build/htdocs/`.
5. Open `deploy-build/htdocs/laravel/.env` and fill `APP_URL`, the `DB_*` values and `CORS_ALLOWED_ORIGINS` (your Netlify address).
6. Upload the **contents** of `deploy-build/htdocs/` to the host's `htdocs` folder with FTP (for example FileZilla). Make `laravel/storage` and `laravel/bootstrap/cache` writable (permission 755 or 775).
7. Check `https://YOUR-API-HOST/api/orders`: it must show JSON.

**Part B - deploy the board to Netlify**
1. Edit `frontend/config.js` and set `API_BASE_URL` to `https://YOUR-API-HOST/api`; commit and push.
2. In Netlify choose **Add new site > Import an existing project**, pick this GitHub repo. Leave the build command empty and set the publish directory to `frontend` (`netlify.toml` already says this). Or drag the `frontend` folder onto Netlify Drop.
3. Open the Netlify address. The table should fill and refresh every 10 seconds.

**Part C - connect them.** Put the exact Netlify address in `CORS_ALLOWED_ORIGINS` in the server's `laravel/.env` (no trailing slash). Netlify is `https`, so the API must be `https` too, otherwise the browser blocks the calls.

**Part D - if the host blocks cross-site calls.** The build script also puts a copy of the board in `htdocs/board/` that talks to the API on the same domain. It works even when a host blocks cross-site requests: open `https://YOUR-API-HOST/board/`.

### Known limitations
- No login: anyone with the link can change a status. Authentication is the natural next step.
- Free hosts are slow to wake and have limits; the board shows "Offline - showing last data" and retries when the API does not answer.

### Where the code is
| What | Path |
|------|------|
| Board page, styles, polling | `frontend/index.html`, `frontend/style.css`, `frontend/app.js` |
| API address | `frontend/config.js` |
| Netlify settings | `netlify.toml` |
| CORS for the API | `config/cors.php` |
| Shared-hosting build, DB import, env template | `deploy/` |
