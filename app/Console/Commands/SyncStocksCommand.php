<?php

namespace App\Console\Commands;

use App\Models\Stock;
use App\Services\StockDataSyncService;
use Illuminate\Console\Command;

class SyncStocksCommand extends Command
{
    protected $signature = 'stocks:sync-all {--ticker= : Sync specific ticker only}';

    protected $description = 'Sync stock data from Alpha Vantage API';

    public function handle(StockDataSyncService $syncService): int
    {
        $ticker = $this->option('ticker');

        if ($ticker) {
            $stock = Stock::query()
                ->where('ticker', strtoupper($ticker))
                ->first();

            if (! $stock) {
                $this->error("Stock with ticker {$ticker} not found.");

                return self::FAILURE;
            }

            $this->info("Syncing data for {$ticker}...");
            $result = $syncService->syncStock($stock);

            $this->table(
                ['Type', 'Status'],
                [
                    ['Metrics', $result['metrics'] ? 'Success' : 'Failed'],
                    ['Prices', $result['prices'] ? 'Success' : 'Failed'],
                ]
            );

            return self::SUCCESS;
        }

        $stocks = Stock::query()->where('is_active', true)->get();
        $this->info("Syncing data for {$stocks->count()} stocks...");

        $progressBar = $this->output->createProgressBar($stocks->count());
        $progressBar->start();

        $results = [];
        foreach ($stocks as $stock) {
            $results[$stock->ticker] = $syncService->syncStock($stock);
            $progressBar->advance();
            sleep(12);
        }

        $progressBar->finish();
        $this->newLine(2);

        $tableData = [];
        foreach ($results as $stockTicker => $result) {
            $tableData[] = [
                $stockTicker,
                $result['metrics'] ? 'Success' : 'Failed',
                $result['prices'] ? 'Success' : 'Failed',
            ];
        }

        $this->table(['Ticker', 'Metrics', 'Prices'], $tableData);
        $this->info('Sync completed!');

        return self::SUCCESS;
    }
}
