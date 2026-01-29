<?php

namespace App\Services;

use App\Models\ApiLog;
use App\Models\Stock;
use App\Models\StockStoryAnalysis;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;

class StockStoryService
{
    private string $pythonScript;

    public function __construct()
    {
        $this->pythonScript = base_path('scripts/fetch_stockstory.py');
    }

    /**
     * Fetch and sync StockStory analysis data for a stock.
     *
     * @return array{success: bool, message: string}
     */
    public function syncStock(Stock $stock): array
    {
        $startTime = microtime(true);

        try {
            $exchange = strtolower($stock->exchange);
            $ticker = strtolower($stock->ticker);

            $result = Process::timeout(60)->run(
                "python \"{$this->pythonScript}\" {$ticker} {$exchange}"
            );

            $responseTime = (int) ((microtime(true) - $startTime) * 1000);

            if (! $result->successful()) {
                $this->logRequest($stock->ticker, 'fetch_stockstory', null, $responseTime, $result->errorOutput());

                return ['success' => false, 'message' => 'Python script failed: '.$result->errorOutput()];
            }

            $data = json_decode($result->output(), true);

            if (! $data || ! ($data['success'] ?? false)) {
                $error = $data['error'] ?? 'Unknown error';
                $this->logRequest($stock->ticker, 'fetch_stockstory', null, $responseTime, $error);

                return ['success' => false, 'message' => $error];
            }

            $this->logRequest($stock->ticker, 'fetch_stockstory', 200, $responseTime);

            $this->saveAnalysis($stock, $data['data'] ?? []);

            return ['success' => true, 'message' => 'StockStory sync completed successfully'];
        } catch (\Exception $e) {
            $responseTime = (int) ((microtime(true) - $startTime) * 1000);
            $this->logRequest($stock->ticker, 'fetch_stockstory', null, $responseTime, $e->getMessage());
            Log::error("StockStory sync failed for {$stock->ticker}: ".$e->getMessage());

            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function saveAnalysis(Stock $stock, array $data): void
    {
        if (empty($data)) {
            return;
        }

        StockStoryAnalysis::query()->updateOrCreate(
            ['stock_id' => $stock->id],
            [
                'investment_rating' => $data['investment_rating'] ?? null,
                'analysis_summary' => $data['analysis_summary'] ?? null,
                'latest_quarter_label' => $data['latest_quarter_label'] ?? null,
                'quarterly_revenue' => $data['quarterly_revenue'] ?? null,
                'quarterly_eps' => $data['quarterly_eps'] ?? null,
                'quarterly_gross_margin' => $data['quarterly_gross_margin'] ?? null,
                'quarterly_operating_margin' => $data['quarterly_operating_margin'] ?? null,
                'revenue_beat_percent' => $data['revenue_beat_percent'] ?? null,
                'eps_beat_percent' => $data['eps_beat_percent'] ?? null,
                'guidance_revenue' => $data['guidance_revenue'] ?? null,
                'guidance_eps' => $data['guidance_eps'] ?? null,
                'guidance_revenue_vs_estimate' => $data['guidance_revenue_vs_estimate'] ?? null,
                'guidance_eps_vs_estimate' => $data['guidance_eps_vs_estimate'] ?? null,
                'revenue_cagr_5y' => $data['revenue_cagr_5y'] ?? null,
                'revenue_cagr_2y' => $data['revenue_cagr_2y'] ?? null,
                'eps_cagr_5y' => $data['eps_cagr_5y'] ?? null,
                'wall_street_revenue_estimate' => $data['wall_street_revenue_estimate'] ?? null,
                'wall_street_eps_estimate' => $data['wall_street_eps_estimate'] ?? null,
                'gross_margin' => $data['gross_margin'] ?? null,
                'operating_margin' => $data['operating_margin'] ?? null,
                'gross_margin_trend' => $data['gross_margin_trend'] ?? null,
                'operating_margin_trend' => $data['operating_margin_trend'] ?? null,
                'roic' => $data['roic'] ?? null,
                'cash' => $data['cash'] ?? null,
                'debt' => $data['debt'] ?? null,
                'net_debt_to_ebitda' => $data['net_debt_to_ebitda'] ?? null,
                'quality_score' => $data['quality_score'] ?? null,
                'value_score' => $data['value_score'] ?? null,
                'key_highlights' => $data['key_highlights'] ?? null,
                'chart_urls' => $data['chart_urls'] ?? null,
            ]
        );
    }

    private function logRequest(
        string $ticker,
        string $endpoint,
        ?int $statusCode,
        int $responseTime,
        ?string $errorMessage = null
    ): void {
        ApiLog::query()->create([
            'provider' => 'stockstory',
            'ticker' => $ticker,
            'endpoint' => $endpoint,
            'status_code' => $statusCode,
            'response_time_ms' => $responseTime,
            'error_message' => $errorMessage,
        ]);
    }
}
