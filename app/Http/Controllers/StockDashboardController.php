<?php

namespace App\Http\Controllers;

use App\Models\Sector;
use App\Models\Stock;
use App\Models\StockFundamental;
use App\Services\ValuationService;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockDashboardController extends Controller
{
    public function __construct(
        private ValuationService $valuationService
    ) {}

    public function index(): Response
    {
        $sectors = Sector::query()
            ->withCount('stocks')
            ->get();

        $stocks = Stock::query()
            ->with(['sector', 'fundamentals' => fn ($q) => $q->latest('date')->limit(1)])
            ->where('is_active', true)
            ->get();

        $latestFundamentals = StockFundamental::query()
            ->select('stock_id', DB::raw('MAX(date) as latest_date'))
            ->groupBy('stock_id');

        $fundamentalsData = StockFundamental::query()
            ->joinSub($latestFundamentals, 'latest', function ($join) {
                $join->on('stock_fundamentals.stock_id', '=', 'latest.stock_id')
                    ->on('stock_fundamentals.date', '=', 'latest.latest_date');
            })
            ->get();

        $summary = [
            'total_stocks' => $stocks->count(),
            'total_sectors' => $sectors->count(),
            'average_pe' => round($fundamentalsData->whereNotNull('pe_ratio')->avg('pe_ratio') ?? 0, 2),
            'average_pb' => round($fundamentalsData->whereNotNull('pb_ratio')->avg('pb_ratio') ?? 0, 2),
            'total_market_cap' => $fundamentalsData->sum('market_cap'),
            'synced_stocks' => $fundamentalsData->count(),
        ];

        return Inertia::render('stocks/index', [
            'sectors' => $sectors,
            'stocks' => $stocks,
            'summary' => $summary,
        ]);
    }

    public function show(string $ticker): Response
    {
        $stock = Stock::query()
            ->with('sector')
            ->where('ticker', strtoupper($ticker))
            ->firstOrFail();

        $fundamental = $stock->fundamentals()
            ->latest('date')
            ->first();

        $financials = $stock->financialStatements()
            ->income()
            ->orderBy('fiscal_date', 'desc')
            ->limit(5)
            ->get();

        $cashflows = $stock->financialStatements()
            ->cashflow()
            ->orderBy('fiscal_date', 'desc')
            ->limit(5)
            ->get();

        $balanceSheets = $stock->financialStatements()
            ->balance()
            ->orderBy('fiscal_date', 'desc')
            ->limit(5)
            ->get();

        $prices = $stock->prices()
            ->orderBy('date', 'desc')
            ->limit(60)
            ->get();

        $valuation = $this->valuationService->calculateValuation($stock);

        return Inertia::render('stocks/show', [
            'stock' => $stock,
            'fundamental' => $fundamental,
            'financials' => $financials,
            'cashflows' => $cashflows,
            'balanceSheets' => $balanceSheets,
            'prices' => $prices,
            'valuation' => $valuation,
        ]);
    }
}
