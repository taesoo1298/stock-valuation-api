<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstitutionalHolder extends Model
{
    protected $fillable = [
        'stock_id',
        'holder_name',
        'shares',
        'date_reported',
        'percent_out',
        'value',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date_reported' => 'date',
            'percent_out' => 'decimal:6',
            'value' => 'decimal:2',
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
