<?php

namespace App\Console\Commands;

use App\Models\Stock;
use App\Services\YahooFinanceService;
use Illuminate\Console\Command;

class SyncYahooFinanceCommand extends Command
{
    protected $signature = 'stocks:sync-yahoo {--ticker= : Sync specific ticker only}';

    protected $description = 'Sync stock data from Yahoo Finance (financials, fundamentals, prices)';

    public function handle(YahooFinanceService $yahooService): int
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

            $this->info("Syncing Yahoo Finance data for {$ticker}...");
            $result = $yahooService->syncStock($stock);

            if ($result['success']) {
                $this->info("✓ {$result['message']}");
            } else {
                $this->error("✗ {$result['message']}");
            }

            return $result['success'] ? self::SUCCESS : self::FAILURE;
        }

        $stocks = Stock::query()->where('is_active', true)->get();
        $this->info("Syncing Yahoo Finance data for {$stocks->count()} stocks...");

        $progressBar = $this->output->createProgressBar($stocks->count());
        $progressBar->start();

        $results = [];
        foreach ($stocks as $stock) {
            $result = $yahooService->syncStock($stock);
            $results[$stock->ticker] = $result;
            $progressBar->advance();

            // Rate limiting: Yahoo Finance can be rate-limited
            sleep(2);
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
