<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * GET /api/orders
     * Returns a JSON array of all orders. Optional filter: /api/orders?status=pending
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::query()->orderBy('id');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $orders = $query->get()->map(fn (Order $order) => $this->present($order))->values();

        return response()->json($orders);
    }

    /**
     * GET /api/orders/{id}
     * Returns one order, or a JSON 404 if it does not exist.
     */
    public function show(Order $order): JsonResponse
    {
        return response()->json($this->present($order));
    }

    /**
     * PATCH /api/orders/{id}
     * Updates the status (validated) and returns the updated order.
     */
    public function update(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $order->update([
            'status' => $request->validated()['status'],
        ]);

        return response()->json($this->present($order->refresh()));
    }

    /**
     * One consistent JSON shape for every endpoint.
     */
    private function present(Order $order): array
    {
        return [
            'id'            => $order->id,
            'customer_name' => $order->customer_name,
            'amount'        => (float) $order->amount,
            'status'        => $order->status,
            'created_at'    => $order->created_at?->toIso8601String(),
            'updated_at'    => $order->updated_at?->toIso8601String(),
        ];
    }
}
