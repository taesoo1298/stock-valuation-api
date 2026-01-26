<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Stock::query()
            ->with('sector')
            ->where('is_active', true);

        if ($request->has('sector_id')) {
            $query->where('sector_id', $request->input('sector_id'));
        }

        $stocks = $query->get();

        return response()->json([
            'data' => $stocks,
        ]);
    }

    public function show(string $ticker): JsonResponse
    {
        $stock = Stock::query()
            ->with(['sector', 'metrics' => fn ($q) => $q->latest('date')->limit(1)])
            ->where('ticker', strtoupper($ticker))
            ->firstOrFail();

        return response()->json([
            'data' => $stock,
        ]);
    }

    public function metrics(Request $request, string $ticker): JsonResponse
    {
        $stock = Stock::query()
            ->where('ticker', strtoupper($ticker))
            ->firstOrFail();

        $limit = $request->input('limit', 30);

        $metrics = $stock->metrics()
            ->latest('date')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $metrics,
        ]);
    }

    public function prices(Request $request, string $ticker): JsonResponse
    {
        $stock = Stock::query()
            ->where('ticker', strtoupper($ticker))
            ->firstOrFail();

        $limit = $request->input('limit', 30);

        $prices = $stock->prices()
            ->latest('date')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $prices,
        ]);
    }
}
