<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SectorBenchmark extends Model
{
    protected $fillable = [
        'etf_ticker',
        'sector_name',
        'sector_name_kr',
        'trailing_pe',
        'forward_pe',
        'pb_ratio',
        'dividend_yield',
        'market_cap',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'trailing_pe' => 'decimal:2',
            'forward_pe' => 'decimal:2',
            'pb_ratio' => 'decimal:2',
            'dividend_yield' => 'decimal:4',
        ];
    }

    /**
     * @return HasMany<Sector, $this>
     */
    public function sectors(): HasMany
    {
        return $this->hasMany(Sector::class, 'benchmark_etf', 'etf_ticker');
    }
}
