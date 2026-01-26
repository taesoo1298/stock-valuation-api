<?php

namespace App\Services;

use App\Models\ApiLog;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class AlphaVantageService
{
    private string $baseUrl = 'https://www.alphavantage.co/query';

    private string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.alpha_vantage.key', '');
    }

    /**
     * Get stock overview (fundamental data).
     *
     * @return array<string, mixed>|null
     */
    public function getOverview(string $ticker): ?array
    {
        return $this->request('OVERVIEW', $ticker);
    }

    /**
     * Get daily time series price data.
     *
     * @return array<string, mixed>|null
     */
    public function getDailyPrices(string $ticker, string $outputSize = 'compact'): ?array
    {
        return $this->request('TIME_SERIES_DAILY', $ticker, [
            'outputsize' => $outputSize,
        ]);
    }

    /**
     * Get global quote for real-time price.
     *
     * @return array<string, mixed>|null
     */
    public function getQuote(string $ticker): ?array
    {
        return $this->request('GLOBAL_QUOTE', $ticker);
    }

    /**
     * Make an API request to Alpha Vantage.
     *
     * @param  array<string, mixed>  $additionalParams
     * @return array<string, mixed>|null
     */
    private function request(string $function, string $ticker, array $additionalParams = []): ?array
    {
        $startTime = microtime(true);

        $params = array_merge([
            'function' => $function,
            'symbol' => $ticker,
            'apikey' => $this->apiKey,
        ], $additionalParams);

        try {
            $response = Http::get($this->baseUrl, $params);
            $responseTime = (int) ((microtime(true) - $startTime) * 1000);

            $this->logRequest($ticker, $function, $response, $responseTime);

            if ($response->successful()) {
                $data = $response->json();

                if (isset($data['Error Message']) || isset($data['Note'])) {
                    return null;
                }

                return $data;
            }

            return null;
        } catch (\Exception $e) {
            $responseTime = (int) ((microtime(true) - $startTime) * 1000);
            $this->logRequest($ticker, $function, null, $responseTime, $e->getMessage());

            return null;
        }
    }

    private function logRequest(
        string $ticker,
        string $endpoint,
        ?Response $response,
        int $responseTime,
        ?string $errorMessage = null
    ): void {
        ApiLog::query()->create([
            'provider' => 'alpha_vantage',
            'ticker' => $ticker,
            'endpoint' => $endpoint,
            'status_code' => $response?->status(),
            'response_time_ms' => $responseTime,
            'error_message' => $errorMessage ?? ($response?->json('Error Message') ?? $response?->json('Note')),
        ]);
    }
}
