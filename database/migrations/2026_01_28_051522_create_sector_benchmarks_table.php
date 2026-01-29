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
        Schema::create('sector_benchmarks', function (Blueprint $table) {
            $table->id();
            $table->string('etf_ticker', 10)->unique();
            $table->string('sector_name');
            $table->string('sector_name_kr');
            $table->decimal('trailing_pe', 10, 2)->nullable();
            $table->decimal('forward_pe', 10, 2)->nullable();
            $table->decimal('pb_ratio', 10, 2)->nullable();
            $table->decimal('dividend_yield', 8, 4)->nullable();
            $table->bigInteger('market_cap')->nullable();
            $table->timestamps();

            $table->index('sector_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sector_benchmarks');
    }
};
