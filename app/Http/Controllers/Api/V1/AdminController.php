<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use App\Services\StockDataSyncService;
use Illuminate\Http\JsonResponse;

class AdminController extends Controller
{
    public function __construct(
        private StockDataSyncService $syncService
    ) {}

    public function sync(?string $ticker = null): JsonResponse
    {
        if ($ticker) {
            $stock = Stock::query()
                ->where('ticker', strtoupper($ticker))
                ->firstOrFail();

            $result = $this->syncService->syncStock($stock);

            return response()->json([
                'message' => "Sync completed for {$ticker}",
                'data' => $result,
            ]);
        }

        $results = $this->syncService->syncAllStocks();

        return response()->json([
            'message' => 'Sync completed for all stocks',
            'data' => $results,
        ]);
    }
}
