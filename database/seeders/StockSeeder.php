<?php

namespace Database\Seeders;

use App\Models\Sector;
use App\Models\Stock;
use Illuminate\Database\Seeder;

class StockSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $stocks = [
            // 반도체
            'SEMICONDUCTOR' => [
                ['ticker' => 'MU', 'name' => 'Micron Technology', 'exchange' => 'NASDAQ'],
                ['ticker' => 'NVDA', 'name' => 'NVIDIA Corporation', 'exchange' => 'NASDAQ'],
                ['ticker' => 'AMD', 'name' => 'Advanced Micro Devices', 'exchange' => 'NASDAQ'],
                ['ticker' => 'AVGO', 'name' => 'Broadcom Inc.', 'exchange' => 'NASDAQ'],
                ['ticker' => 'QCOM', 'name' => 'Qualcomm Inc.', 'exchange' => 'NASDAQ'],
            ],
            // 스토리지
            'STORAGE' => [
                ['ticker' => 'WDC', 'name' => 'Western Digital', 'exchange' => 'NASDAQ'],
                ['ticker' => 'STX', 'name' => 'Seagate Technology', 'exchange' => 'NASDAQ'],
            ],
            // 로봇
            'ROBOTICS' => [
                ['ticker' => 'SYM', 'name' => 'Symbotic Inc.', 'exchange' => 'NASDAQ'],
                ['ticker' => 'TER', 'name' => 'Teradyne Inc.', 'exchange' => 'NASDAQ'],
            ],
            // 전력
            'POWER' => [
                ['ticker' => 'GEV', 'name' => 'GE Vernova Inc.', 'exchange' => 'NYSE'],
                ['ticker' => 'VST', 'name' => 'Vistra Corp.', 'exchange' => 'NYSE'],
            ],
            // IT서비스
            'IT_SERVICES' => [
                ['ticker' => 'IBM', 'name' => 'IBM Corporation', 'exchange' => 'NYSE'],
            ],
        ];

        foreach ($stocks as $sectorCode => $sectorStocks) {
            $sector = Sector::query()->where('code', $sectorCode)->first();

            if (! $sector) {
                continue;
            }

            foreach ($sectorStocks as $stockData) {
                Stock::query()->updateOrCreate(
                    ['ticker' => $stockData['ticker']],
                    array_merge($stockData, ['sector_id' => $sector->id])
                );
            }
        }
    }
}
