<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EarningsHistory extends Model
{
    protected $fillable = [
        'stock_id',
        'earnings_date',
        'eps_estimate',
        'reported_eps',
        'surprise_percent',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'earnings_date' => 'datetime',
            'eps_estimate' => 'decimal:4',
            'reported_eps' => 'decimal:4',
            'surprise_percent' => 'decimal:4',
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
