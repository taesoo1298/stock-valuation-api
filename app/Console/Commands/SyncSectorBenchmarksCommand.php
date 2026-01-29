<?php

namespace App\Console\Commands;

use App\Models\SectorBenchmark;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;

class SyncSectorBenchmarksCommand extends Command
{
    protected $signature = 'sectors:sync-benchmarks';

    protected $description = 'Sync sector benchmark PER data from ETFs';

    public function handle(): int
    {
        $this->info('Fetching sector benchmark data...');

        $pythonScript = base_path('scripts/fetch_sector_benchmarks.py');
        $result = Process::timeout(120)->run("python \"{$pythonScript}\"");

        if (! $result->successful()) {
            $this->error('Python script failed: '.$result->errorOutput());

            return self::FAILURE;
        }

        $data = json_decode($result->output(), true);

        if (! $data || ! ($data['success'] ?? false)) {
            $this->error('Failed to parse benchmark data');

            return self::FAILURE;
        }

        $benchmarks = $data['benchmarks'] ?? [];
        $successCount = 0;

        foreach ($benchmarks as $benchmark) {
            if (isset($benchmark['error'])) {
                $this->warn("Skipping {$benchmark['etf_ticker']}: {$benchmark['error']}");

                continue;
            }

            SectorBenchmark::query()->updateOrCreate(
                ['etf_ticker' => $benchmark['etf_ticker']],
                [
                    'sector_name' => $benchmark['sector_name'],
                    'sector_name_kr' => $benchmark['sector_name_kr'],
                    'trailing_pe' => $benchmark['trailing_pe'],
                    'forward_pe' => $benchmark['forward_pe'],
                    'pb_ratio' => $benchmark['pb_ratio'],
                    'dividend_yield' => $benchmark['dividend_yield'],
                    'market_cap' => $benchmark['market_cap'],
                ]
            );
            $successCount++;
        }

        $this->info("Synced {$successCount} sector benchmarks.");

        // Display table
        $tableData = SectorBenchmark::query()
            ->orderBy('trailing_pe', 'desc')
            ->get()
            ->map(fn ($b) => [
                $b->etf_ticker,
                $b->sector_name_kr,
                $b->trailing_pe ? number_format($b->trailing_pe, 2) : '-',
                $b->forward_pe ? number_format($b->forward_pe, 2) : '-',
                $b->pb_ratio ? number_format($b->pb_ratio, 2) : '-',
            ])
            ->toArray();

        $this->table(
            ['ETF', '섹터', 'Trailing PER', 'Forward PER', 'PBR'],
            $tableData
        );

        return self::SUCCESS;
    }
}
