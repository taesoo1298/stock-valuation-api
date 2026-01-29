<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EarningsEstimate extends Model
{
    protected $fillable = [
        'stock_id',
        'estimate_type',
        'period',
        'estimate_avg',
        'estimate_low',
        'estimate_high',
        'year_ago_value',
        'number_of_analysts',
        'growth',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'estimate_avg' => 'decimal:4',
            'estimate_low' => 'decimal:4',
            'estimate_high' => 'decimal:4',
            'year_ago_value' => 'decimal:4',
            'growth' => 'decimal:6',
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
