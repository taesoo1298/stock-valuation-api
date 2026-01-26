<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Sector;
use App\Models\Stock;
use App\Models\StockMetric;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ValuationController extends Controller
{
    public function overview(): JsonResponse
    {
        $latestMetrics = StockMetric::query()
            ->select('stock_id', DB::raw('MAX(date) as latest_date'))
            ->groupBy('stock_id');

        $metrics = StockMetric::query()
            ->joinSub($latestMetrics, 'latest', function ($join) {
                $join->on('stock_metrics.stock_id', '=', 'latest.stock_id')
                    ->on('stock_metrics.date', '=', 'latest.latest_date');
            })
            ->with('stock.sector')
            ->get();

        $avgPe = $metrics->whereNotNull('pe_ratio')->avg('pe_ratio');
        $avgPb = $metrics->whereNotNull('pb_ratio')->avg('pb_ratio');
        $avgPs = $metrics->whereNotNull('ps_ratio')->avg('ps_ratio');
        $totalMarketCap = $metrics->sum('market_cap');

        return response()->json([
            'data' => [
                'total_stocks' => $metrics->count(),
                'average_pe' => round($avgPe ?? 0, 2),
                'average_pb' => round($avgPb ?? 0, 2),
                'average_ps' => round($avgPs ?? 0, 2),
                'total_market_cap' => $totalMarketCap,
                'stocks' => $metrics,
            ],
        ]);
    }

    public function undervalued(Request $request): JsonResponse
    {
        $maxPe = $request->input('max_pe', 15);
        $maxPb = $request->input('max_pb', 2);

        $latestMetrics = StockMetric::query()
            ->select('stock_id', DB::raw('MAX(date) as latest_date'))
            ->groupBy('stock_id');

        $stocks = StockMetric::query()
            ->joinSub($latestMetrics, 'latest', function ($join) {
                $join->on('stock_metrics.stock_id', '=', 'latest.stock_id')
                    ->on('stock_metrics.date', '=', 'latest.latest_date');
            })
            ->with('stock.sector')
            ->where(function ($query) use ($maxPe, $maxPb) {
                $query->where('pe_ratio', '<=', $maxPe)
                    ->orWhere('pb_ratio', '<=', $maxPb);
            })
            ->whereNotNull('pe_ratio')
            ->orderBy('pe_ratio')
            ->get();

        return response()->json([
            'data' => $stocks,
            'filters' => [
                'max_pe' => $maxPe,
                'max_pb' => $maxPb,
            ],
        ]);
    }

    public function compare(Request $request): JsonResponse
    {
        $tickers = $request->input('tickers', []);

        if (empty($tickers)) {
            return response()->json([
                'error' => 'Please provide tickers to compare',
            ], 422);
        }

        $tickerArray = is_array($tickers) ? $tickers : explode(',', $tickers);
        $tickerArray = array_map('strtoupper', array_map('trim', $tickerArray));

        $stocks = Stock::query()
            ->with(['sector', 'metrics' => fn ($q) => $q->latest('date')->limit(1)])
            ->whereIn('ticker', $tickerArray)
            ->get();

        return response()->json([
            'data' => $stocks,
        ]);
    }

    public function sectorAnalysis(): JsonResponse
    {
        $sectors = Sector::query()
            ->with(['stocks' => function ($query) {
                $query->where('is_active', true)
                    ->with(['metrics' => fn ($q) => $q->latest('date')->limit(1)]);
            }])
            ->get()
            ->map(function ($sector) {
                $metrics = $sector->stocks->flatMap->metrics;

                return [
                    'id' => $sector->id,
                    'name' => $sector->name,
                    'code' => $sector->code,
                    'stock_count' => $sector->stocks->count(),
                    'average_pe' => round($metrics->whereNotNull('pe_ratio')->avg('pe_ratio') ?? 0, 2),
                    'average_pb' => round($metrics->whereNotNull('pb_ratio')->avg('pb_ratio') ?? 0, 2),
                    'average_ps' => round($metrics->whereNotNull('ps_ratio')->avg('ps_ratio') ?? 0, 2),
                    'total_market_cap' => $metrics->sum('market_cap'),
                    'stocks' => $sector->stocks,
                ];
            });

        return response()->json([
            'data' => $sectors,
        ]);
    }
}
