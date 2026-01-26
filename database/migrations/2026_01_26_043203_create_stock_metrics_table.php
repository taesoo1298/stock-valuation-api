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
        Schema::create('stock_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->decimal('current_price', 12, 4)->nullable();
            $table->decimal('pe_ratio', 10, 4)->nullable();
            $table->decimal('forward_pe', 10, 4)->nullable();
            $table->decimal('pb_ratio', 10, 4)->nullable();
            $table->decimal('ps_ratio', 10, 4)->nullable();
            $table->decimal('ev_ebitda', 10, 4)->nullable();
            $table->decimal('peg_ratio', 10, 4)->nullable();
            $table->decimal('roe', 10, 4)->nullable();
            $table->decimal('dividend_yield', 10, 4)->nullable();
            $table->decimal('market_cap', 20, 2)->nullable();
            $table->timestamps();

            $table->unique(['stock_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_metrics');
    }
};
