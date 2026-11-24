<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeOrder(string $name = 'Ayesha Khan', string $status = 'pending'): Order
    {
        return Order::create([
            'customer_name' => $name,
            'amount'        => 50000,
            'status'        => $status,
        ]);
    }

    public function test_index_returns_json_array_of_orders(): void
    {
        $this->makeOrder('Ayesha Khan');
        $this->makeOrder('Bilal Ahmed', 'approved');

        $this->getJson('/api/orders')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.customer_name', 'Ayesha Khan')
            ->assertJsonStructure([['id', 'customer_name', 'amount', 'status', 'created_at', 'updated_at']]);
    }

    public function test_index_can_filter_by_status(): void
    {
        $this->makeOrder('Ayesha Khan', 'pending');
        $this->makeOrder('Bilal Ahmed', 'approved');

        $this->getJson('/api/orders?status=approved')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.customer_name', 'Bilal Ahmed');
    }

    public function test_show_returns_single_order(): void
    {
        $order = $this->makeOrder();

        $this->getJson('/api/orders/' . $order->id)
            ->assertOk()
            ->assertJsonPath('id', $order->id)
            ->assertJsonPath('customer_name', 'Ayesha Khan')
            ->assertJsonPath('status', 'pending');
    }

    public function test_show_returns_404_json_for_missing_order(): void
    {
        $this->getJson('/api/orders/9999')->assertNotFound();
    }

    public function test_patch_updates_status_and_returns_updated_order(): void
    {
        $order = $this->makeOrder();

        $this->patchJson('/api/orders/' . $order->id, ['status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('id', $order->id)
            ->assertJsonPath('status', 'approved');

        $this->assertSame('approved', $order->fresh()->status);
    }

    public function test_patch_rejects_invalid_status(): void
    {
        $order = $this->makeOrder();

        $this->patchJson('/api/orders/' . $order->id, ['status' => 'banana'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');

        $this->assertSame('pending', $order->fresh()->status);
    }

    public function test_patch_requires_status(): void
    {
        $order = $this->makeOrder();

        $this->patchJson('/api/orders/' . $order->id, [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }
}
