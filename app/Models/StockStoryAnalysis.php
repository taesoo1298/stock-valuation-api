<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockStoryAnalysis extends Model
{
    protected $fillable = [
        'stock_id',
        'investment_rating',
        'analysis_summary',
        'latest_quarter_label',
        'quarterly_revenue',
        'quarterly_eps',
        'quarterly_gross_margin',
        'quarterly_operating_margin',
        'revenue_beat_percent',
        'eps_beat_percent',
        'guidance_revenue',
        'guidance_eps',
        'guidance_revenue_vs_estimate',
        'guidance_eps_vs_estimate',
        'revenue_cagr_5y',
        'revenue_cagr_2y',
        'eps_cagr_5y',
        'wall_street_revenue_estimate',
        'wall_street_eps_estimate',
        'gross_margin',
        'operating_margin',
        'gross_margin_trend',
        'operating_margin_trend',
        'roic',
        'cash',
        'debt',
        'net_debt_to_ebitda',
        'quality_score',
        'value_score',
        'key_highlights',
        'chart_urls',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quarterly_revenue' => 'decimal:2',
            'quarterly_eps' => 'decimal:4',
            'quarterly_gross_margin' => 'decimal:2',
            'quarterly_operating_margin' => 'decimal:2',
            'revenue_beat_percent' => 'decimal:2',
            'eps_beat_percent' => 'decimal:2',
            'guidance_revenue' => 'decimal:2',
            'guidance_eps' => 'decimal:4',
            'guidance_revenue_vs_estimate' => 'decimal:2',
            'guidance_eps_vs_estimate' => 'decimal:2',
            'revenue_cagr_5y' => 'decimal:2',
            'revenue_cagr_2y' => 'decimal:2',
            'eps_cagr_5y' => 'decimal:2',
            'wall_street_revenue_estimate' => 'decimal:2',
            'wall_street_eps_estimate' => 'decimal:4',
            'gross_margin' => 'decimal:2',
            'operating_margin' => 'decimal:2',
            'roic' => 'decimal:2',
            'cash' => 'decimal:2',
            'debt' => 'decimal:2',
            'net_debt_to_ebitda' => 'decimal:2',
            'quality_score' => 'decimal:1',
            'value_score' => 'decimal:1',
            'key_highlights' => 'array',
            'chart_urls' => 'array',
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
