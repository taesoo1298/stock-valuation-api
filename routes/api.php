<?php

use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\SectorController;
use App\Http\Controllers\Api\V1\StockController;
use App\Http\Controllers\Api\V1\ValuationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Sectors
    Route::get('sectors', [SectorController::class, 'index'])->name('api.v1.sectors.index');
    Route::get('sectors/{sector}', [SectorController::class, 'show'])->name('api.v1.sectors.show');
    Route::get('sectors/{sector}/stocks', [SectorController::class, 'stocks'])->name('api.v1.sectors.stocks');

    // Stocks
    Route::get('stocks', [StockController::class, 'index'])->name('api.v1.stocks.index');
    Route::get('stocks/{ticker}', [StockController::class, 'show'])->name('api.v1.stocks.show');
    Route::get('stocks/{ticker}/metrics', [StockController::class, 'metrics'])->name('api.v1.stocks.metrics');
    Route::get('stocks/{ticker}/prices', [StockController::class, 'prices'])->name('api.v1.stocks.prices');

    // Valuation
    Route::get('valuation/overview', [ValuationController::class, 'overview'])->name('api.v1.valuation.overview');
    Route::get('valuation/undervalued', [ValuationController::class, 'undervalued'])->name('api.v1.valuation.undervalued');
    Route::get('valuation/compare', [ValuationController::class, 'compare'])->name('api.v1.valuation.compare');
    Route::get('valuation/sector-analysis', [ValuationController::class, 'sectorAnalysis'])->name('api.v1.valuation.sector-analysis');

    // Admin (sync)
    Route::post('admin/sync/{ticker?}', [AdminController::class, 'sync'])->name('api.v1.admin.sync');
});
