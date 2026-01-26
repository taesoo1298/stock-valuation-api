<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockFundamental extends Model
{
    protected $fillable = [
        'stock_id',
        'date',
        // 밸류에이션
        'current_price',
        'market_cap',
        'enterprise_value',
        'pe_ratio',
        'forward_pe',
        'peg_ratio',
        'pb_ratio',
        'ps_ratio',
        'ev_ebitda',
        'ev_revenue',
        // 수익성
        'profit_margin',
        'operating_margin',
        'gross_margin',
        'roe',
        'roa',
        // 주당 지표
        'eps',
        'forward_eps',
        'book_value',
        'revenue_per_share',
        // 배당
        'dividend_rate',
        'dividend_yield',
        'payout_ratio',
        // 성장률
        'earnings_growth',
        'revenue_growth',
        // 재무 건전성
        'total_cash',
        'total_debt',
        'debt_to_equity',
        'current_ratio',
        'quick_ratio',
        // 현금흐름
        'operating_cashflow',
        'free_cashflow',
        // 기타
        'beta',
        'week_52_high',
        'week_52_low',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Stock, $this>
     */
    public function stock(): BelongsTo
    {
        return $this->belongsTo(Stock::class);
    }
}
