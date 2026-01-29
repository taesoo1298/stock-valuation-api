<?php

use App\Http\Controllers\StockDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/stocks', [StockDashboardController::class, 'index'])->name('stocks.index');
Route::post('/stocks', [StockDashboardController::class, 'store'])->name('stocks.store');
Route::get('/stocks/{ticker}', [StockDashboardController::class, 'show'])->name('stocks.show');
Route::get('/stocks/{ticker}/story', [StockDashboardController::class, 'story'])->name('stocks.story');
Route::delete('/stocks/{ticker}', [StockDashboardController::class, 'destroy'])->name('stocks.destroy');

Route::post('/sectors', [StockDashboardController::class, 'storeSector'])->name('sectors.store');
Route::delete('/sectors/{sector}', [StockDashboardController::class, 'destroySector'])->name('sectors.destroy');
