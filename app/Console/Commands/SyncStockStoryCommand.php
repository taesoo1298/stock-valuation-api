<?php

namespace App\Console\Commands;

use App\Models\Stock;
use App\Services\StockStoryService;
use Illuminate\Console\Command;

class SyncStockStoryCommand extends Command
{
    protected $signature = 'stocks:sync-stockstory {--ticker= : Sync specific ticker only}';

    protected $description = 'Sync stock analysis data from StockStory.org';

    public function handle(StockStoryService $stockStoryService): int
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

            $this->info("Syncing StockStory data for {$ticker}...");
            $result = $stockStoryService->syncStock($stock);

            if ($result['success']) {
                $this->info("✓ {$result['message']}");
            } else {
                $this->error("✗ {$result['message']}");
            }

            return $result['success'] ? self::SUCCESS : self::FAILURE;
        }

        $stocks = Stock::query()->where('is_active', true)->get();
        $this->info("Syncing StockStory data for {$stocks->count()} stocks...");

        $progressBar = $this->output->createProgressBar($stocks->count());
        $progressBar->start();

        $results = [];
        foreach ($stocks as $stock) {
            $result = $stockStoryService->syncStock($stock);
            $results[$stock->ticker] = $result;
            $progressBar->advance();

            sleep(3);
        }

        $progressBar->finish();
        $this->newLine(2);

        $tableData = [];
        foreach ($results as $stockTicker => $result) {
            $tableData[] = [
                $stockTicker,
                $result['success'] ? '✓ Success' : '✗ Failed',
                $result['message'],
            ];
        }

        $this->table(['Ticker', 'Status', 'Message'], $tableData);

        $successCount = count(array_filter($results, fn ($r) => $r['success']));
        $this->info("Sync completed! {$successCount}/{$stocks->count()} successful.");

        return self::SUCCESS;
    }
}
