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
        Schema::create('stock_story_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_id')->constrained()->cascadeOnDelete();

            // 투자 등급
            $table->string('investment_rating')->nullable();
            $table->text('analysis_summary')->nullable();

            // 최근 분기 실적
            $table->string('latest_quarter_label')->nullable();
            $table->decimal('quarterly_revenue', 20, 2)->nullable();
            $table->decimal('quarterly_eps', 12, 4)->nullable();
            $table->decimal('quarterly_gross_margin', 8, 2)->nullable();
            $table->decimal('quarterly_operating_margin', 8, 2)->nullable();
            $table->decimal('revenue_beat_percent', 8, 2)->nullable();
            $table->decimal('eps_beat_percent', 8, 2)->nullable();

            // 가이던스
            $table->decimal('guidance_revenue', 20, 2)->nullable();
            $table->decimal('guidance_eps', 12, 4)->nullable();
            $table->decimal('guidance_revenue_vs_estimate', 8, 2)->nullable();
            $table->decimal('guidance_eps_vs_estimate', 8, 2)->nullable();

            // 성장 지표
            $table->decimal('revenue_cagr_5y', 8, 2)->nullable();
            $table->decimal('revenue_cagr_2y', 8, 2)->nullable();
            $table->decimal('eps_cagr_5y', 8, 2)->nullable();
            $table->decimal('wall_street_revenue_estimate', 20, 2)->nullable();
            $table->decimal('wall_street_eps_estimate', 12, 4)->nullable();

            // 수익성
            $table->decimal('gross_margin', 8, 2)->nullable();
            $table->decimal('operating_margin', 8, 2)->nullable();
            $table->string('gross_margin_trend')->nullable();
            $table->string('operating_margin_trend')->nullable();
            $table->decimal('roic', 8, 2)->nullable();

            // 재무 건전성
            $table->decimal('cash', 20, 2)->nullable();
            $table->decimal('debt', 20, 2)->nullable();
            $table->decimal('net_debt_to_ebitda', 8, 2)->nullable();

            // 비교 점수
            $table->decimal('quality_score', 5, 1)->nullable();
            $table->decimal('value_score', 5, 1)->nullable();

            // JSON 데이터
            $table->json('key_highlights')->nullable();
            $table->json('chart_urls')->nullable();

            $table->timestamps();

            $table->unique('stock_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_story_analyses');
    }
};
