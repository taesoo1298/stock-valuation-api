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
        Schema::create('financial_statements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_id')->constrained()->cascadeOnDelete();
            $table->date('fiscal_date');
            $table->enum('statement_type', ['income', 'balance', 'cashflow']);

            // 손익계산서 (Income Statement)
            $table->decimal('total_revenue', 20, 2)->nullable();
            $table->decimal('gross_profit', 20, 2)->nullable();
            $table->decimal('operating_income', 20, 2)->nullable();
            $table->decimal('net_income', 20, 2)->nullable();
            $table->decimal('ebitda', 20, 2)->nullable();
            $table->decimal('basic_eps', 12, 4)->nullable();
            $table->decimal('diluted_eps', 12, 4)->nullable();

            // 재무상태표 (Balance Sheet)
            $table->decimal('total_assets', 20, 2)->nullable();
            $table->decimal('total_liabilities', 20, 2)->nullable();
            $table->decimal('stockholders_equity', 20, 2)->nullable();
            $table->decimal('total_debt', 20, 2)->nullable();
            $table->decimal('cash_and_equivalents', 20, 2)->nullable();
            $table->decimal('current_assets', 20, 2)->nullable();
            $table->decimal('current_liabilities', 20, 2)->nullable();

            // 현금흐름표 (Cash Flow)
            $table->decimal('operating_cashflow', 20, 2)->nullable();
            $table->decimal('investing_cashflow', 20, 2)->nullable();
            $table->decimal('financing_cashflow', 20, 2)->nullable();
            $table->decimal('free_cashflow', 20, 2)->nullable();
            $table->decimal('capex', 20, 2)->nullable();

            $table->timestamps();

            $table->unique(['stock_id', 'fiscal_date', 'statement_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_statements');
    }
};
