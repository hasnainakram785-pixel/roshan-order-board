# Task 3 - Submission note

**Public URLs (fill in before submitting)**
- Live board (Netlify): https://YOUR-SITE.netlify.app
- API (free PHP host):  https://YOUR-API-HOST/api/orders

**What I did**
- Built the live board in plain HTML, CSS and JavaScript (`frontend/`, no build step).
- `app.js` fetches `GET /api/orders` immediately and then every 10 seconds, and redraws the table. A new request never starts while the previous one is still running, and if the API is unreachable the board keeps the last data and shows a retry message.
- Each status has its own colour and a text label (pending = amber, under review = blue, approved = green, disbursed = teal, rejected = red), so colour is never the only signal. Rows whose status changed since the last poll flash briefly.
- Staff can change a status from a dropdown on each row; it sends `PATCH /api/orders/{id}` from Task 2.
- Added `config/cors.php` so the Netlify page is allowed to call the API, `netlify.toml` for the front-end, and `deploy/` (build script, `.env` template, `schema.sql`) to deploy the Laravel API to shared hosting without SSH.
- Documented every deployment step in the README.

**Why**
- Vanilla JS keeps the board light and avoids a build step on Netlify; the API address lives in one file (`frontend/config.js`).
- Polling (not websockets) is what the brief asks for and works on free hosting.
- `schema.sql` is needed because free shared hosting has no `php artisan migrate`.
- Known limitation: the board has no login, so anyone with the link can change a status. Authentication would be the next step.

**How I tested**
- Ran the API locally and the board against it; checked that the table refreshes every 10 seconds and that changing a status updates the row.
- `node tests-js/app.test.js` checks the polling loop (10 s interval, no overlapping requests, keeps running after an error) and the helpers.
