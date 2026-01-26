<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMetric extends Model
{
    /** @use HasFactory<\Database\Factories\StockMetricFactory> */
    use HasFactory;

    protected $fillable = [
        'stock_id',
        'date',
        'current_price',
        'pe_ratio',
        'forward_pe',
        'pb_ratio',
        'ps_ratio',
        'ev_ebitda',
        'peg_ratio',
        'roe',
        'dividend_yield',
        'market_cap',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'current_price' => 'decimal:4',
            'pe_ratio' => 'decimal:4',
            'forward_pe' => 'decimal:4',
            'pb_ratio' => 'decimal:4',
            'ps_ratio' => 'decimal:4',
            'ev_ebitda' => 'decimal:4',
            'peg_ratio' => 'decimal:4',
            'roe' => 'decimal:4',
            'dividend_yield' => 'decimal:4',
            'market_cap' => 'decimal:2',
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
