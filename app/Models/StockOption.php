<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOption extends Model
{
    protected $fillable = [
        'stock_id',
        'option_type',
        'contract_symbol',
        'expiration_date',
        'strike',
        'last_price',
        'bid',
        'ask',
        'change',
        'percent_change',
        'volume',
        'open_interest',
        'implied_volatility',
        'in_the_money',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expiration_date' => 'date',
            'strike' => 'decimal:2',
            'last_price' => 'decimal:4',
            'bid' => 'decimal:4',
            'ask' => 'decimal:4',
            'change' => 'decimal:4',
            'percent_change' => 'decimal:4',
            'implied_volatility' => 'decimal:6',
            'in_the_money' => 'boolean',
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
