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
        Schema::create('earnings_estimates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_id')->constrained()->cascadeOnDelete();
            $table->enum('estimate_type', ['eps', 'revenue']);
            $table->string('period');
            $table->decimal('estimate_avg', 20, 4)->nullable();
            $table->decimal('estimate_low', 20, 4)->nullable();
            $table->decimal('estimate_high', 20, 4)->nullable();
            $table->decimal('year_ago_value', 20, 4)->nullable();
            $table->integer('number_of_analysts')->nullable();
            $table->decimal('growth', 10, 6)->nullable();
            $table->timestamps();

            $table->unique(['stock_id', 'estimate_type', 'period'], 'earnings_estimate_unique');
            $table->index('stock_id');
        });

        Schema::create('earnings_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_id')->constrained()->cascadeOnDelete();
            $table->dateTime('earnings_date');
            $table->decimal('eps_estimate', 12, 4)->nullable();
            $table->decimal('reported_eps', 12, 4)->nullable();
            $table->decimal('surprise_percent', 10, 4)->nullable();
            $table->timestamps();

            $table->unique(['stock_id', 'earnings_date'], 'earnings_history_unique');
            $table->index('stock_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('earnings_histories');
        Schema::dropIfExists('earnings_estimates');
    }
};
