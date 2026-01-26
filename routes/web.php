<?php

use App\Http\Controllers\StockDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/stocks', [StockDashboardController::class, 'index'])->name('stocks.index');
Route::get('/stocks/{ticker}', [StockDashboardController::class, 'show'])->name('stocks.show');
