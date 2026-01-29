<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalystRating extends Model
{
    protected $fillable = [
        'stock_id',
        'target_high',
        'target_low',
        'target_mean',
        'target_median',
        'strong_buy',
        'buy',
        'hold',
        'sell',
        'strong_sell',
        'next_earnings_date',
        'next_eps_estimate',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'target_high' => 'decimal:2',
            'target_low' => 'decimal:2',
            'target_mean' => 'decimal:2',
            'target_median' => 'decimal:2',
            'next_earnings_date' => 'date',
            'next_eps_estimate' => 'decimal:4',
        ];
    }

    /**
     * @return BelongsTo<Stock, $this>
     */
    public function stock(): BelongsTo
    {
        return $this->belongsTo(Stock::class);
    }

    public function getTotalRecommendationsAttribute(): int
    {
        return $this->strong_buy + $this->buy + $this->hold + $this->sell + $this->strong_sell;
    }

    public function getConsensusAttribute(): string
    {
        $total = $this->total_recommendations;
        if ($total === 0) {
            return '정보없음';
        }

        $buyPercent = (($this->strong_buy + $this->buy) / $total) * 100;
        $sellPercent = (($this->sell + $this->strong_sell) / $total) * 100;

        if ($buyPercent >= 70) {
            return '강력매수';
        }
        if ($buyPercent >= 50) {
            return '매수';
        }
        if ($sellPercent >= 50) {
            return '매도';
        }

        return '보유';
    }
}
