<?php

namespace Database\Factories;

use App\Models\Stock;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StockPrice>
 */
class StockPriceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $close = fake()->randomFloat(4, 10, 500);

        return [
            'stock_id' => Stock::factory(),
            'date' => fake()->date(),
            'open' => $close * fake()->randomFloat(4, 0.95, 1.05),
            'high' => $close * fake()->randomFloat(4, 1.01, 1.10),
            'low' => $close * fake()->randomFloat(4, 0.90, 0.99),
            'close' => $close,
            'volume' => fake()->numberBetween(100_000, 100_000_000),
        ];
    }
}
