<?php

use App\Http\Controllers\Api\OrderController;
use App\Http\Middleware\ForceJsonResponse;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes  (all URLs are prefixed with /api)
|--------------------------------------------------------------------------
|
| GET        /api/orders        -> OrderController@index
| GET        /api/orders/{id}   -> OrderController@show
| PATCH/PUT  /api/orders/{id}   -> OrderController@update
|
*/

Route::middleware(ForceJsonResponse::class)->group(function () {
    Route::apiResource('orders', OrderController::class)->only(['index', 'show', 'update']);
});
