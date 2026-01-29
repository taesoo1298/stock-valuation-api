<?php

namespace App\Services;

use App\Models\AnalystRating;
use App\Models\ApiLog;
use App\Models\EarningsEstimate;
use App\Models\EarningsHistory;
use App\Models\FinancialStatement;
use App\Models\InsiderTransaction;
use App\Models\InstitutionalHolder;
use App\Models\Stock;
use App\Models\StockFundamental;
use App\Models\StockOption;
use App\Models\StockPrice;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class YahooFinanceService
{
    private string $pythonScript;

    public function __construct()
    {
        $this->pythonScript = base_path('scripts/fetch_financials.py');
    }

    /**
     * Fetch and sync all data for a stock.
     *
     * @return array{success: bool, message: string}
     */
    public function syncStock(Stock $stock): array
    {
        $startTime = microtime(true);

        try {
            $result = Process::timeout(120)->run("python \"{$this->pythonScript}\" {$stock->ticker}");

            $responseTime = (int) ((microtime(true) - $startTime) * 1000);

            if (! $result->successful()) {
                $this->logRequest($stock->ticker, 'fetch_financials', null, $responseTime, $result->errorOutput());

                return ['success' => false, 'message' => 'Python script failed: '.$result->errorOutput()];
            }

            $data = json_decode($result->output(), true);

            if (! $data || ! ($data['success'] ?? false)) {
                $error = $data['error'] ?? 'Unknown error';
                $this->logRequest($stock->ticker, 'fetch_financials', null, $responseTime, $error);

                return ['success' => false, 'message' => $error];
            }

            $this->logRequest($stock->ticker, 'fetch_financials', 200, $responseTime);

            // Save fundamentals
            $this->saveFundamentals($stock, $data['info'] ?? []);

            // Save financial statements
            $this->saveIncomeStatements($stock, $data['income_stmt'] ?? []);
            $this->saveBalanceSheets($stock, $data['balance_sheet'] ?? []);
            $this->saveCashflows($stock, $data['cashflow'] ?? []);

            // Save price history
            $this->savePriceHistory($stock, $data['history'] ?? []);

            // Save options data
            $this->saveOptions($stock, $data['options'] ?? []);

            // Save holdings data (institutional holders, insider transactions)
            $this->saveHoldings($stock, $data['holdings'] ?? []);

            // Save earnings data (estimates, history, analyst ratings)
            $this->saveEarnings($stock, $data['earnings'] ?? []);

            return ['success' => true, 'message' => 'Sync completed successfully'];
        } catch (\Exception $e) {
            $responseTime = (int) ((microtime(true) - $startTime) * 1000);
            $this->logRequest($stock->ticker, 'fetch_financials', null, $responseTime, $e->getMessage());
            Log::error("YahooFinance sync failed for {$stock->ticker}: ".$e->getMessage());

            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * @param  array<string, mixed>  $info
     */
    private function saveFundamentals(Stock $stock, array $info): void
    {
        if (empty($info)) {
            return;
        }

        $today = Carbon::today()->toDateString();

        StockFundamental::query()->updateOrCreate(
            [
                'stock_id' => $stock->id,
                'date' => $today,
            ],
            [
                'current_price' => $info['current_price'] ?? null,
                'market_cap' => $info['market_cap'] ?? null,
                'enterprise_value' => $info['enterprise_value'] ?? null,
                'pe_ratio' => $info['pe_ratio'] ?? null,
                'forward_pe' => $info['forward_pe'] ?? null,
                'peg_ratio' => $info['peg_ratio'] ?? null,
                'pb_ratio' => $info['pb_ratio'] ?? null,
                'ps_ratio' => $info['ps_ratio'] ?? null,
                'ev_ebitda' => $info['ev_ebitda'] ?? null,
                'ev_revenue' => $info['ev_revenue'] ?? null,
                'profit_margin' => $info['profit_margin'] ?? null,
                'operating_margin' => $info['operating_margin'] ?? null,
                'gross_margin' => $info['gross_margin'] ?? null,
                'roe' => $info['roe'] ?? null,
                'roa' => $info['roa'] ?? null,
                'eps' => $info['eps'] ?? null,
                'forward_eps' => $info['forward_eps'] ?? null,
                'book_value' => $info['book_value'] ?? null,
                'revenue_per_share' => $info['revenue_per_share'] ?? null,
                'dividend_rate' => $info['dividend_rate'] ?? null,
                'dividend_yield' => $info['dividend_yield'] ?? null,
                'payout_ratio' => $info['payout_ratio'] ?? null,
                'earnings_growth' => $info['earnings_growth'] ?? null,
                'revenue_growth' => $info['revenue_growth'] ?? null,
                'total_cash' => $info['total_cash'] ?? null,
                'total_debt' => $info['total_debt'] ?? null,
                'debt_to_equity' => $info['debt_to_equity'] ?? null,
                'current_ratio' => $info['current_ratio'] ?? null,
                'quick_ratio' => $info['quick_ratio'] ?? null,
                'operating_cashflow' => $info['operating_cashflow'] ?? null,
                'free_cashflow' => $info['free_cashflow'] ?? null,
                'beta' => $info['beta'] ?? null,
                'week_52_high' => $info['52_week_high'] ?? null,
                'week_52_low' => $info['52_week_low'] ?? null,
            ]
        );
    }

    /**
     * @param  array<string, array<string, mixed>>  $statements
     */
    private function saveIncomeStatements(Stock $stock, array $statements): void
    {
        foreach ($statements as $date => $data) {
            if (isset($data['error'])) {
                continue;
            }

            FinancialStatement::query()->updateOrCreate(
                [
                    'stock_id' => $stock->id,
                    'fiscal_date' => Carbon::parse($date)->toDateString(),
                    'statement_type' => 'income',
                ],
                [
                    'total_revenue' => $data['total_revenue'] ?? null,
                    'gross_profit' => $data['gross_profit'] ?? null,
                    'operating_income' => $data['operating_income'] ?? null,
                    'net_income' => $data['net_income'] ?? null,
                    'ebitda' => $data['ebitda'] ?? null,
                    'basic_eps' => $data['basic_eps'] ?? null,
                    'diluted_eps' => $data['diluted_eps'] ?? null,
                ]
            );
        }
    }

    /**
     * @param  array<string, array<string, mixed>>  $statements
     */
    private function saveBalanceSheets(Stock $stock, array $statements): void
    {
        foreach ($statements as $date => $data) {
            if (isset($data['error'])) {
                continue;
            }

            FinancialStatement::query()->updateOrCreate(
                [
                    'stock_id' => $stock->id,
                    'fiscal_date' => Carbon::parse($date)->toDateString(),
                    'statement_type' => 'balance',
                ],
                [
                    'total_assets' => $data['total_assets'] ?? null,
                    'total_liabilities' => $data['total_liabilities'] ?? null,
                    'stockholders_equity' => $data['stockholders_equity'] ?? null,
                    'total_debt' => $data['total_debt'] ?? null,
                    'cash_and_equivalents' => $data['cash_and_equivalents'] ?? null,
                    'current_assets' => $data['current_assets'] ?? null,
                    'current_liabilities' => $data['current_liabilities'] ?? null,
                ]
            );
        }
    }

    /**
     * @param  array<string, array<string, mixed>>  $statements
     */
    private function saveCashflows(Stock $stock, array $statements): void
    {
        foreach ($statements as $date => $data) {
            if (isset($data['error'])) {
                continue;
            }

            FinancialStatement::query()->updateOrCreate(
                [
                    'stock_id' => $stock->id,
                    'fiscal_date' => Carbon::parse($date)->toDateString(),
                    'statement_type' => 'cashflow',
                ],
                [
                    'operating_cashflow' => $data['operating_cashflow'] ?? null,
                    'investing_cashflow' => $data['investing_cashflow'] ?? null,
                    'financing_cashflow' => $data['financing_cashflow'] ?? null,
                    'free_cashflow' => $data['free_cashflow'] ?? null,
                    'capex' => $data['capex'] ?? null,
                ]
            );
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $history
     */
    private function savePriceHistory(Stock $stock, array $history): void
    {
        foreach ($history as $priceData) {
            if (empty($priceData['date'])) {
                continue;
            }

            StockPrice::query()->updateOrCreate(
                [
                    'stock_id' => $stock->id,
                    'date' => Carbon::parse($priceData['date'])->toDateString(),
                ],
                [
                    'open' => $priceData['open'] ?? null,
                    'high' => $priceData['high'] ?? null,
                    'low' => $priceData['low'] ?? null,
                    'close' => $priceData['close'] ?? null,
                    'volume' => $priceData['volume'] ?? null,
                ]
            );
        }
    }

    /**
     * @param  array{expiration_dates?: array<string>, chains?: array<array<string, mixed>>, error?: string}  $optionsData
     */
    private function saveOptions(Stock $stock, array $optionsData): void
    {
        if (empty($optionsData['chains'])) {
            return;
        }

        foreach ($optionsData['chains'] as $chain) {
            $expirationDate = $chain['expiration_date'] ?? null;
            if (! $expirationDate) {
                continue;
            }

            // Save call options
            foreach ($chain['calls'] ?? [] as $option) {
                $this->saveOption($stock, 'call', $expirationDate, $option);
            }

            // Save put options
            foreach ($chain['puts'] ?? [] as $option) {
                $this->saveOption($stock, 'put', $expirationDate, $option);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $option
     */
    private function saveOption(Stock $stock, string $optionType, string $expirationDate, array $option): void
    {
        if (! isset($option['strike'])) {
            return;
        }

        StockOption::query()->updateOrCreate(
            [
                'stock_id' => $stock->id,
                'option_type' => $optionType,
                'expiration_date' => Carbon::parse($expirationDate)->toDateString(),
                'strike' => $option['strike'],
            ],
            [
                'contract_symbol' => $option['contract_symbol'] ?? null,
                'last_price' => $option['last_price'] ?? null,
                'bid' => $option['bid'] ?? null,
                'ask' => $option['ask'] ?? null,
                'change' => $option['change'] ?? null,
                'percent_change' => $option['percent_change'] ?? null,
                'volume' => $option['volume'] ?? null,
                'open_interest' => $option['open_interest'] ?? null,
                'implied_volatility' => $option['implied_volatility'] ?? null,
                'in_the_money' => $option['in_the_money'] ?? null,
            ]
        );
    }

    /**
     * @param  array{major_holders?: array<string, mixed>, institutional_holders?: array<array<string, mixed>>, insider_transactions?: array<array<string, mixed>>, insider_holders?: array<array<string, mixed>>, error?: string}  $holdingsData
     */
    private function saveHoldings(Stock $stock, array $holdingsData): void
    {
        // Save institutional holders
        foreach ($holdingsData['institutional_holders'] ?? [] as $holder) {
            if (empty($holder['holder'])) {
                continue;
            }

            $dateReported = isset($holder['date_reported']) ? Carbon::parse($holder['date_reported'])->toDateString() : null;

            InstitutionalHolder::query()->updateOrCreate(
                [
                    'stock_id' => $stock->id,
                    'holder_name' => $holder['holder'],
                    'date_reported' => $dateReported,
                ],
                [
                    'shares' => $holder['shares'] ?? null,
                    'percent_out' => $holder['percent_out'] ?? null,
                    'value' => $holder['value'] ?? null,
                ]
            );
        }

        // Save insider transactions
        foreach ($holdingsData['insider_transactions'] ?? [] as $transaction) {
            if (empty($transaction['insider'])) {
                continue;
            }

            $transactionDate = isset($transaction['start_date']) ? Carbon::parse($transaction['start_date'])->toDateString() : null;

            InsiderTransaction::query()->updateOrCreate(
                [
                    'stock_id' => $stock->id,
                    'insider_name' => $transaction['insider'],
                    'transaction_date' => $transactionDate,
                    'shares' => $transaction['shares'] ?? null,
                ],
                [
                    'position' => $transaction['position'] ?? null,
                    'transaction_type' => $transaction['transaction_type'] ?? null,
                    'value' => $transaction['value'] ?? null,
                    'url' => $transaction['url'] ?? null,
                ]
            );
        }
    }

    /**
     * @param  array{earnings_dates?: array<array<string, mixed>>, earnings_estimate?: array<array<string, mixed>>, revenue_estimate?: array<array<string, mixed>>, calendar?: array<string, mixed>, analyst_price_targets?: array<string, mixed>, recommendations?: array<array<string, mixed>>, error?: string}  $earningsData
     */
    private function saveEarnings(Stock $stock, array $earningsData): void
    {
        // Save EPS estimates
        foreach ($earningsData['earnings_estimate'] ?? [] as $estimate) {
            if (empty($estimate['period'])) {
                continue;
            }

            EarningsEstimate::query()->updateOrCreate(
                [
                    'stock_id' => $stock->id,
                    'estimate_type' => 'eps',
                    'period' => $estimate['period'],
                ],
                [
                    'estimate_avg' => $estimate['avg'] ?? null,
                    'estimate_low' => $estimate['low'] ?? null,
                    'estimate_high' => $estimate['high'] ?? null,
                    'year_ago_value' => $estimate['year_ago_eps'] ?? null,
                    'number_of_analysts' => $estimate['number_of_analysts'] ?? null,
                    'growth' => $estimate['growth'] ?? null,
                ]
            );
        }

        // Save revenue estimates
        foreach ($earningsData['revenue_estimate'] ?? [] as $estimate) {
            if (empty($estimate['period'])) {
                continue;
            }

            EarningsEstimate::query()->updateOrCreate(
                [
                    'stock_id' => $stock->id,
                    'estimate_type' => 'revenue',
                    'period' => $estimate['period'],
                ],
                [
                    'estimate_avg' => $estimate['avg'] ?? null,
                    'estimate_low' => $estimate['low'] ?? null,
                    'estimate_high' => $estimate['high'] ?? null,
                    'year_ago_value' => $estimate['year_ago_revenue'] ?? null,
                    'number_of_analysts' => $estimate['number_of_analysts'] ?? null,
                    'growth' => $estimate['growth'] ?? null,
                ]
            );
        }

        // Save earnings history
        foreach ($earningsData['earnings_dates'] ?? [] as $history) {
            if (empty($history['earnings_date'])) {
                continue;
            }

            EarningsHistory::query()->updateOrCreate(
                [
                    'stock_id' => $stock->id,
                    'earnings_date' => Carbon::parse($history['earnings_date'])->toDateTimeString(),
                ],
                [
                    'eps_estimate' => $history['eps_estimate'] ?? null,
                    'reported_eps' => $history['reported_eps'] ?? null,
                    'surprise_percent' => $history['surprise_percent'] ?? null,
                ]
            );
        }

        // Save analyst rating
        $calendar = $earningsData['calendar'] ?? [];
        $targets = $earningsData['analyst_price_targets'] ?? [];
        $recommendations = $earningsData['recommendations'][0] ?? [];

        if (! empty($targets) || ! empty($recommendations) || ! empty($calendar)) {
            AnalystRating::query()->updateOrCreate(
                ['stock_id' => $stock->id],
                [
                    'target_high' => $targets['high'] ?? null,
                    'target_low' => $targets['low'] ?? null,
                    'target_mean' => $targets['mean'] ?? null,
                    'target_median' => $targets['median'] ?? null,
                    'strong_buy' => $recommendations['strong_buy'] ?? 0,
                    'buy' => $recommendations['buy'] ?? 0,
                    'hold' => $recommendations['hold'] ?? 0,
                    'sell' => $recommendations['sell'] ?? 0,
                    'strong_sell' => $recommendations['strong_sell'] ?? 0,
                    'next_earnings_date' => isset($calendar['earnings_date']) ? Carbon::parse($calendar['earnings_date'])->toDateString() : null,
                    'next_eps_estimate' => $calendar['earnings_avg'] ?? null,
                ]
            );
        }
    }

    private function logRequest(
        string $ticker,
        string $endpoint,
        ?int $statusCode,
        int $responseTime,
        ?string $errorMessage = null
    ): void {
        ApiLog::query()->create([
            'provider' => 'yahoo_finance',
            'ticker' => $ticker,
            'endpoint' => $endpoint,
            'status_code' => $statusCode,
            'response_time_ms' => $responseTime,
            'error_message' => $errorMessage,
        ]);
    }
}
