# Task 2 - Submission note

**What I did**
- Built the REST API for orders in Laravel: `GET /api/orders`, `GET /api/orders/{id}` and `PATCH /api/orders/{id}`.
- `app/Http/Controllers/Api/OrderController.php` has `index`, `show` and `update`. Routes are in `routes/api.php` (`Route::apiResource(...)->only([...])`).
- Added validation in `app/Http/Requests/UpdateOrderStatusRequest.php`: `status` is required and must be one of `pending`, `under_review`, `approved`, `disbursed`, `rejected` (the same list the model uses).
- Every endpoint returns the same JSON shape (`id`, `customer_name`, `amount`, `status`, `created_at`, `updated_at`). Invalid status gives a 422 JSON error; a missing order gives a 404 JSON error.
- Tested all endpoints in Postman (collection: `docs/OrderBoard.postman_collection.json`) and added feature tests in `tests/Feature/OrderApiTest.php`.
- Documented the endpoints with examples in the README.

**Why**
- A Form Request keeps validation out of the controller and returns proper 422 errors.
- A small middleware forces JSON, so the API never answers with an HTML error page, even when the client does not send an Accept header.
- Only `status` is updatable, because staff only need to move an application through its stages; this also stops accidental edits to name or amount.
- `GET /api/orders` returns a plain JSON array, which is the simplest thing for the live board front-end in Task 3 to poll.
