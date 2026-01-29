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
        Schema::create('stock_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_id')->constrained()->cascadeOnDelete();
            $table->enum('option_type', ['call', 'put']);
            $table->string('contract_symbol')->nullable();
            $table->date('expiration_date');
            $table->decimal('strike', 12, 2);
            $table->decimal('last_price', 12, 4)->nullable();
            $table->decimal('bid', 12, 4)->nullable();
            $table->decimal('ask', 12, 4)->nullable();
            $table->decimal('change', 12, 4)->nullable();
            $table->decimal('percent_change', 8, 4)->nullable();
            $table->unsignedBigInteger('volume')->nullable();
            $table->unsignedBigInteger('open_interest')->nullable();
            $table->decimal('implied_volatility', 8, 6)->nullable();
            $table->boolean('in_the_money')->nullable();
            $table->timestamps();

            $table->unique(['stock_id', 'option_type', 'expiration_date', 'strike'], 'stock_option_unique');
            $table->index(['stock_id', 'expiration_date']);
            $table->index(['stock_id', 'option_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_options');
    }
};
