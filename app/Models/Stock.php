<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Stock extends Model
{
    /** @use HasFactory<\Database\Factories\StockFactory> */
    use HasFactory;

    protected $fillable = [
        'sector_id',
        'ticker',
        'name',
        'exchange',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Sector, $this>
     */
    public function sector(): BelongsTo
    {
        return $this->belongsTo(Sector::class);
    }

    /**
     * @return HasMany<StockMetric, $this>
     */
    public function metrics(): HasMany
    {
        return $this->hasMany(StockMetric::class);
    }

    /**
     * @return HasMany<StockPrice, $this>
     */
    public function prices(): HasMany
    {
        return $this->hasMany(StockPrice::class);
    }

    /**
     * @return HasMany<FinancialStatement, $this>
     */
    public function financialStatements(): HasMany
    {
        return $this->hasMany(FinancialStatement::class);
    }

    /**
     * @return HasMany<StockFundamental, $this>
     */
    public function fundamentals(): HasMany
    {
        return $this->hasMany(StockFundamental::class);
    }
}
