<?php

namespace App\Http\Controllers;

use App\Models\Sector;
use App\Models\SectorBenchmark;
use App\Models\Stock;
use App\Models\StockFundamental;
use App\Services\ValuationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            ->limit(12)
            ->get();

        // 옵션 데이터 (만기일별 요약)
        $options = $stock->options()
            ->selectRaw('option_type, expiration_date, COUNT(*) as count, SUM(volume) as total_volume, SUM(open_interest) as total_open_interest')
            ->groupBy('option_type', 'expiration_date')
            ->orderBy('expiration_date')
            ->get();

        // 기관투자자 보유현황
        $institutionalHolders = $stock->institutionalHolders()
            ->orderByDesc('shares')
            ->limit(10)
            ->get();

        // 내부자 거래
        $insiderTransactions = $stock->insiderTransactions()
            ->orderByDesc('transaction_date')
            ->limit(20)
            ->get();

        // 실적 예측 (EPS, Revenue)
        $earningsEstimates = $stock->earningsEstimates()
            ->orderBy('estimate_type')
            ->orderBy('period')
            ->get();

        // 실적 발표 히스토리
        $earningsHistories = $stock->earningsHistories()
            ->orderByDesc('earnings_date')
            ->limit(12)
            ->get();

        // 애널리스트 평점
        $analystRating = $stock->analystRating;

        // 섹터 벤치마크
        $sectorBenchmark = null;
        if ($stock->sector?->benchmark_etf) {
            $sectorBenchmark = SectorBenchmark::query()
                ->where('etf_ticker', $stock->sector->benchmark_etf)
                ->first();
        }

        $valuation = $this->valuationService->calculateValuation($stock);

        return Inertia::render('stocks/show', [
            'stock' => $stock,
            'fundamental' => $fundamental,
            'financials' => $financials,
            'cashflows' => $cashflows,
            'balanceSheets' => $balanceSheets,
            'prices' => $prices,
            'options' => $options,
            'institutionalHolders' => $institutionalHolders,
            'insiderTransactions' => $insiderTransactions,
            'earningsEstimates' => $earningsEstimates,
            'earningsHistories' => $earningsHistories,
            'analystRating' => $analystRating,
            'sectorBenchmark' => $sectorBenchmark,
            'valuation' => $valuation,
        ]);
    }

    public function story(string $ticker): Response
    {
        $stock = Stock::query()
            ->with('sector')
            ->where('ticker', strtoupper($ticker))
            ->firstOrFail();

        $analysis = $stock->stockStoryAnalysis;

        return Inertia::render('stocks/story', [
            'stock' => $stock,
            'analysis' => $analysis,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ticker' => 'required|string|max:10|unique:stocks,ticker',
            'name' => 'required|string|max:255',
            'exchange' => 'required|string|in:NASDAQ,NYSE,AMEX',
            'sector_id' => 'required|exists:sectors,id',
        ]);

        $validated['ticker'] = strtoupper($validated['ticker']);
        $validated['is_active'] = true;

        Stock::create($validated);

        return redirect()->route('stocks.index')
            ->with('success', '종목이 추가되었습니다.');
    }

    public function destroy(string $ticker): RedirectResponse
    {
        $stock = Stock::where('ticker', strtoupper($ticker))->firstOrFail();
        $stock->delete();

        return redirect()->route('stocks.index')
            ->with('success', '종목이 삭제되었습니다.');
    }

    public function storeSector(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:sectors,code',
            'description' => 'nullable|string|max:500',
        ]);

        $validated['code'] = strtoupper($validated['code']);

        Sector::create($validated);

        return redirect()->route('stocks.index')
            ->with('success', '섹터가 추가되었습니다.');
    }

    public function destroySector(Sector $sector): RedirectResponse
    {
        if ($sector->stocks()->count() > 0) {
            return redirect()->route('stocks.index')
                ->with('error', '종목이 있는 섹터는 삭제할 수 없습니다.');
        }

        $sector->delete();

        return redirect()->route('stocks.index')
            ->with('success', '섹터가 삭제되었습니다.');
    }
}
