<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialStatement extends Model
{
    protected $fillable = [
        'stock_id',
        'fiscal_date',
        'statement_type',
        // 손익계산서
        'total_revenue',
        'gross_profit',
        'operating_income',
        'net_income',
        'ebitda',
        'basic_eps',
        'diluted_eps',
        // 재무상태표
        'total_assets',
        'total_liabilities',
        'stockholders_equity',
        'total_debt',
        'cash_and_equivalents',
        'current_assets',
        'current_liabilities',
        // 현금흐름표
        'operating_cashflow',
        'investing_cashflow',
        'financing_cashflow',
        'free_cashflow',
        'capex',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fiscal_date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Stock, $this>
     */
    public function stock(): BelongsTo
    {
        return $this->belongsTo(Stock::class);
    }

    public function scopeIncome($query)
    {
        return $query->where('statement_type', 'income');
    }

    public function scopeBalance($query)
    {
        return $query->where('statement_type', 'balance');
    }

    public function scopeCashflow($query)
    {
        return $query->where('statement_type', 'cashflow');
    }
}
