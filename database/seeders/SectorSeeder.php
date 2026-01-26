<?php

namespace Database\Seeders;

use App\Models\Sector;
use Illuminate\Database\Seeder;

class SectorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sectors = [
            [
                'name' => '반도체',
                'code' => 'SEMICONDUCTOR',
                'description' => '반도체 설계, 제조 및 장비 기업',
            ],
            [
                'name' => '스토리지',
                'code' => 'STORAGE',
                'description' => '데이터 스토리지 및 메모리 기업',
            ],
            [
                'name' => '로봇',
                'code' => 'ROBOTICS',
                'description' => '산업용 로봇 및 자동화 기업',
            ],
            [
                'name' => '전력',
                'code' => 'POWER',
                'description' => '전력 설비 및 에너지 기업',
            ],
            [
                'name' => 'IT서비스',
                'code' => 'IT_SERVICES',
                'description' => 'IT 컨설팅 및 서비스 기업',
            ],
        ];

        foreach ($sectors as $sector) {
            Sector::query()->updateOrCreate(
                ['code' => $sector['code']],
                $sector
            );
        }
    }
}
