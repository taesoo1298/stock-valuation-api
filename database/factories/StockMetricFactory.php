<?php

namespace Database\Factories;

use App\Models\Stock;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StockMetric>
 */
class StockMetricFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'stock_id' => Stock::factory(),
            'date' => fake()->date(),
            'current_price' => fake()->randomFloat(4, 10, 500),
            'pe_ratio' => fake()->randomFloat(4, 5, 100),
            'forward_pe' => fake()->randomFloat(4, 5, 80),
            'pb_ratio' => fake()->randomFloat(4, 0.5, 20),
            'ps_ratio' => fake()->randomFloat(4, 0.5, 30),
            'ev_ebitda' => fake()->randomFloat(4, 3, 50),
            'peg_ratio' => fake()->randomFloat(4, 0.5, 5),
            'roe' => fake()->randomFloat(4, -20, 50),
            'dividend_yield' => fake()->randomFloat(4, 0, 10),
            'market_cap' => fake()->randomFloat(2, 1_000_000_000, 1_000_000_000_000),
        ];
    }
}
