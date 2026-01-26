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
        Schema::create('stock_fundamentals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_id')->constrained()->cascadeOnDelete();
            $table->date('date');

            // 밸류에이션
            $table->decimal('current_price', 12, 4)->nullable();
            $table->decimal('market_cap', 20, 2)->nullable();
            $table->decimal('enterprise_value', 20, 2)->nullable();
            $table->decimal('pe_ratio', 12, 4)->nullable();
            $table->decimal('forward_pe', 12, 4)->nullable();
            $table->decimal('peg_ratio', 12, 4)->nullable();
            $table->decimal('pb_ratio', 12, 4)->nullable();
            $table->decimal('ps_ratio', 12, 4)->nullable();
            $table->decimal('ev_ebitda', 12, 4)->nullable();
            $table->decimal('ev_revenue', 12, 4)->nullable();

            // 수익성
            $table->decimal('profit_margin', 12, 6)->nullable();
            $table->decimal('operating_margin', 12, 6)->nullable();
            $table->decimal('gross_margin', 12, 6)->nullable();
            $table->decimal('roe', 12, 6)->nullable();
            $table->decimal('roa', 12, 6)->nullable();

            // 주당 지표
            $table->decimal('eps', 12, 4)->nullable();
            $table->decimal('forward_eps', 12, 4)->nullable();
            $table->decimal('book_value', 12, 4)->nullable();
            $table->decimal('revenue_per_share', 12, 4)->nullable();

            // 배당
            $table->decimal('dividend_rate', 12, 4)->nullable();
            $table->decimal('dividend_yield', 12, 6)->nullable();
            $table->decimal('payout_ratio', 12, 6)->nullable();

            // 성장률
            $table->decimal('earnings_growth', 12, 6)->nullable();
            $table->decimal('revenue_growth', 12, 6)->nullable();

            // 재무 건전성
            $table->decimal('total_cash', 20, 2)->nullable();
            $table->decimal('total_debt', 20, 2)->nullable();
            $table->decimal('debt_to_equity', 12, 4)->nullable();
            $table->decimal('current_ratio', 12, 4)->nullable();
            $table->decimal('quick_ratio', 12, 4)->nullable();

            // 현금흐름
            $table->decimal('operating_cashflow', 20, 2)->nullable();
            $table->decimal('free_cashflow', 20, 2)->nullable();

            // 기타
            $table->decimal('beta', 12, 4)->nullable();
            $table->decimal('week_52_high', 12, 4)->nullable();
            $table->decimal('week_52_low', 12, 4)->nullable();

            $table->timestamps();

            $table->unique(['stock_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_fundamentals');
    }
};
