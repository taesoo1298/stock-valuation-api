<?php

namespace App\Services;

use App\Models\Stock;
use App\Models\StockMetric;
use App\Models\StockPrice;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class StockDataSyncService
{
    public function __construct(
        private AlphaVantageService $alphaVantage
    ) {}

    /**
     * Sync data for a single stock.
     *
     * @return array{metrics: bool, prices: bool}
     */
    public function syncStock(Stock $stock): array
    {
        $result = [
            'metrics' => false,
            'prices' => false,
        ];

        $result['metrics'] = $this->syncMetrics($stock);

        sleep(2);
        $result['prices'] = $this->syncPrices($stock);

        return $result;
    }

    /**
     * Sync all active stocks.
     *
     * @return array<string, array{metrics: bool, prices: bool}>
     */
    public function syncAllStocks(): array
    {
        $results = [];
        $stocks = Stock::query()->where('is_active', true)->get();

        foreach ($stocks as $stock) {
            $results[$stock->ticker] = $this->syncStock($stock);
            sleep(12);
        }

        return $results;
    }

    /**
     * Sync metrics for a stock.
     */
    private function syncMetrics(Stock $stock): bool
    {
        $overview = $this->alphaVantage->getOverview($stock->ticker);

        if (! $overview) {
            Log::warning("Failed to fetch overview for {$stock->ticker}");

            return false;
        }

        $today = Carbon::today();

        StockMetric::query()->updateOrCreate(
            [
                'stock_id' => $stock->id,
                'date' => $today,
            ],
            [
                'current_price' => $this->parseNumeric($overview['50DayMovingAverage'] ?? null),
                'pe_ratio' => $this->parseNumeric($overview['PERatio'] ?? null),
                'forward_pe' => $this->parseNumeric($overview['ForwardPE'] ?? null),
                'pb_ratio' => $this->parseNumeric($overview['PriceToBookRatio'] ?? null),
                'ps_ratio' => $this->parseNumeric($overview['PriceToSalesRatioTTM'] ?? null),
                'ev_ebitda' => $this->parseNumeric($overview['EVToEBITDA'] ?? null),
                'peg_ratio' => $this->parseNumeric($overview['PEGRatio'] ?? null),
                'roe' => $this->parseNumeric($overview['ReturnOnEquityTTM'] ?? null),
                'dividend_yield' => $this->parseNumeric($overview['DividendYield'] ?? null),
                'market_cap' => $this->parseNumeric($overview['MarketCapitalization'] ?? null),
            ]
        );

        return true;
    }

    /**
     * Sync daily prices for a stock.
     */
    private function syncPrices(Stock $stock): bool
    {
        $data = $this->alphaVantage->getDailyPrices($stock->ticker);

        logger($data);

        if (! $data || ! isset($data['Time Series (Daily)'])) {
            Log::warning("Failed to fetch prices for {$stock->ticker}");

            return false;
        }

        $timeSeries = $data['Time Series (Daily)'];
        $count = 0;

        foreach ($timeSeries as $date => $priceData) {
            if ($count >= 30) {
                break;
            }

            StockPrice::query()->updateOrCreate(
                [
                    'stock_id' => $stock->id,
                    'date' => $date,
                ],
                [
                    'open' => $this->parseNumeric($priceData['1. open'] ?? null),
                    'high' => $this->parseNumeric($priceData['2. high'] ?? null),
                    'low' => $this->parseNumeric($priceData['3. low'] ?? null),
                    'close' => $this->parseNumeric($priceData['4. close'] ?? null),
                    'volume' => $this->parseNumeric($priceData['5. volume'] ?? null),
                ]
            );

            $count++;
        }

        return true;
    }

    private function parseNumeric(mixed $value): ?float
    {
        if ($value === null || $value === '' || $value === 'None' || $value === '-') {
            return null;
        }

        return (float) $value;
    }
}
