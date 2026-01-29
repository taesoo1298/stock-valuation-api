<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('analyst_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_id')->constrained()->cascadeOnDelete();
            $table->decimal('target_high', 12, 2)->nullable();
            $table->decimal('target_low', 12, 2)->nullable();
            $table->decimal('target_mean', 12, 2)->nullable();
            $table->decimal('target_median', 12, 2)->nullable();
            $table->integer('strong_buy')->default(0);
            $table->integer('buy')->default(0);
            $table->integer('hold')->default(0);
            $table->integer('sell')->default(0);
            $table->integer('strong_sell')->default(0);
            $table->date('next_earnings_date')->nullable();
            $table->decimal('next_eps_estimate', 12, 4)->nullable();
            $table->timestamps();

            $table->unique('stock_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analyst_ratings');
    }
};
