<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sector extends Model
{
    /** @use HasFactory<\Database\Factories\SectorFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'benchmark_etf',
    ];

    /**
     * @return HasMany<Stock, $this>
     */
    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class);
    }

    /**
     * @return BelongsTo<SectorBenchmark, $this>
     */
    public function benchmark(): BelongsTo
    {
        return $this->belongsTo(SectorBenchmark::class, 'benchmark_etf', 'etf_ticker');
    }
}
