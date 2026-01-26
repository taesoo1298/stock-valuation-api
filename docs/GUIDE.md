# Laravel 재무 데이터 API 구축 완전 가이드

> 주식 밸류에이션 데이터를 자동 수집하고 API로 제공하는 Laravel 프로젝트

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [Laravel 프로젝트 생성](#laravel-프로젝트-생성)
3. [데이터베이스 설계](#데이터베이스-설계)
4. [모델 및 마이그레이션](#모델-및-마이그레이션)
5. [외부 API 연동 서비스](#외부-api-연동-서비스)
6. [API 엔드포인트 구현](#api-엔드포인트-구현)
7. [자동화 스케줄링](#자동화-스케줄링)
8. [API 문서 및 테스트](#api-문서-및-테스트)
9. [배포 및 최적화](#배포-및-최적화)

---

## 프로젝트 개요

### 주요 기능
- 📊 실시간 주식 데이터 수집 (Alpha Vantage, Yahoo Finance API)
- 💾 데이터베이스 저장 및 히스토리 관리
- 🔄 자동 데이터 업데이트 (Laravel Scheduler)
- 🌐 RESTful API 제공
- 📈 밸류에이션 지표 자동 계산
- 🔍 섹터별/종목별 필터링

### 기술 스택
CLAUDE.md 참조
---

## Laravel 프로젝트 생성

```bash

# 필요한 패키지 설치
composer require guzzlehttp/guzzle
composer require predis/predis
composer require dedoc/scramble
```

### 2. 환경 설정

`.env` 파일 수정:

```env
APP_NAME="Stock Valuation API"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=stock_valuation
DB_USERNAME=root
DB_PASSWORD=

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# API Keys
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
FINNHUB_API_KEY=your_finnhub_key

# Rate Limiting
API_RATE_LIMIT=60
API_RATE_LIMIT_PERIOD=1
```

### 3. 데이터베이스 생성

```bash
mysql -u root -p
CREATE DATABASE stock_valuation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

---

## 데이터베이스 설계

### ERD 구조

```
sectors (섹터)
  └─ stocks (종목)
       └─ stock_metrics (지표 히스토리)
       └─ stock_prices (가격 히스토리)
```

### 테이블 스키마

#### 1. sectors (섹터 테이블)
```sql
- id: bigint (PK)
- name: varchar(100) -- '반도체', '스토리지', '전력' 등
- code: varchar(50) -- 'SEMICONDUCTOR', 'STORAGE' 등
- description: text
- created_at, updated_at
```

#### 2. stocks (종목 테이블)
```sql
- id: bigint (PK)
- sector_id: bigint (FK)
- ticker: varchar(10) UNIQUE -- 'AAPL', 'MSFT' 등
- name: varchar(100) -- '애플', '마이크로소프트'
- exchange: varchar(50) -- 'NASDAQ', 'NYSE'
- is_active: boolean DEFAULT true
- created_at, updated_at
```

#### 3. stock_metrics (밸류에이션 지표)
```sql
- id: bigint (PK)
- stock_id: bigint (FK)
- date: date
- current_price: decimal(12,2)
- pe_ratio: decimal(8,2) NULL
- forward_pe: decimal(8,2) NULL
- pb_ratio: decimal(8,2) NULL
- ps_ratio: decimal(8,2) NULL
- ev_ebitda: decimal(8,2) NULL
- peg_ratio: decimal(8,2) NULL
- roe: decimal(8,4) NULL -- 퍼센트 (0.2555 = 25.55%)
- dividend_yield: decimal(8,4) NULL
- market_cap: bigint NULL
- created_at, updated_at
- UNIQUE(stock_id, date)
```

#### 4. stock_prices (가격 히스토리)
```sql
- id: bigint (PK)
- stock_id: bigint (FK)
- date: date
- open: decimal(12,2)
- high: decimal(12,2)
- low: decimal(12,2)
- close: decimal(12,2)
- volume: bigint
- created_at, updated_at
- UNIQUE(stock_id, date)
```

#### 5. api_logs (API 호출 로그)
```sql
- id: bigint (PK)
- provider: varchar(50) -- 'alpha_vantage', 'finnhub'
- ticker: varchar(10)
- endpoint: varchar(100)
- status_code: int
- response_time_ms: int
- error_message: text NULL
- created_at
```

---

## 모델 및 마이그레이션

### 마이그레이션 생성

```bash
php artisan make:model Sector -m
php artisan make:model Stock -m
php artisan make:model StockMetric -m
php artisan make:model StockPrice -m
php artisan make:model ApiLog -m
```

### 1. Sector Migration

`database/migrations/xxxx_create_sectors_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sectors', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 50)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sectors');
    }
};
```

### 2. Stock Migration

`database/migrations/xxxx_create_stocks_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sector_id')->constrained()->onDelete('cascade');
            $table->string('ticker', 10)->unique();
            $table->string('name', 100);
            $table->string('exchange', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['sector_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stocks');
    }
};
```

### 3. StockMetric Migration

`database/migrations/xxxx_create_stock_metrics_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->decimal('current_price', 12, 2);
            $table->decimal('pe_ratio', 8, 2)->nullable();
            $table->decimal('forward_pe', 8, 2)->nullable();
            $table->decimal('pb_ratio', 8, 2)->nullable();
            $table->decimal('ps_ratio', 8, 2)->nullable();
            $table->decimal('ev_ebitda', 8, 2)->nullable();
            $table->decimal('peg_ratio', 8, 2)->nullable();
            $table->decimal('roe', 8, 4)->nullable();
            $table->decimal('dividend_yield', 8, 4)->nullable();
            $table->bigInteger('market_cap')->nullable();
            $table->timestamps();
            
            $table->unique(['stock_id', 'date']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_metrics');
    }
};
```

### 4. StockPrice Migration

`database/migrations/xxxx_create_stock_prices_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->decimal('open', 12, 2);
            $table->decimal('high', 12, 2);
            $table->decimal('low', 12, 2);
            $table->decimal('close', 12, 2);
            $table->bigInteger('volume');
            $table->timestamps();
            
            $table->unique(['stock_id', 'date']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_prices');
    }
};
```

### 5. ApiLog Migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_logs', function (Blueprint $table) {
            $table->id();
            $table->string('provider', 50);
            $table->string('ticker', 10)->nullable();
            $table->string('endpoint', 100);
            $table->integer('status_code');
            $table->integer('response_time_ms')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('created_at');
            
            $table->index(['provider', 'created_at']);
            $table->index('ticker');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('api_logs');
    }
};
```

### 마이그레이션 실행

```bash
php artisan migrate
```

---

## 모델 정의

### 1. Sector Model

`app/Models/Sector.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sector extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
    ];

    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class);
    }
}
```

### 2. Stock Model

`app/Models/Stock.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Stock extends Model
{
    protected $fillable = [
        'sector_id',
        'ticker',
        'name',
        'exchange',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function sector(): BelongsTo
    {
        return $this->belongsTo(Sector::class);
    }

    public function metrics(): HasMany
    {
        return $this->hasMany(StockMetric::class);
    }

    public function prices(): HasMany
    {
        return $this->hasMany(StockPrice::class);
    }

    public function latestMetric()
    {
        return $this->hasOne(StockMetric::class)->latestOfMany('date');
    }
}
```

### 3. StockMetric Model

`app/Models/StockMetric.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMetric extends Model
{
    protected $fillable = [
        'stock_id',
        'date',
        'current_price',
        'pe_ratio',
        'forward_pe',
        'pb_ratio',
        'ps_ratio',
        'ev_ebitda',
        'peg_ratio',
        'roe',
        'dividend_yield',
        'market_cap',
    ];

    protected $casts = [
        'date' => 'date',
        'current_price' => 'decimal:2',
        'pe_ratio' => 'decimal:2',
        'forward_pe' => 'decimal:2',
        'pb_ratio' => 'decimal:2',
        'ps_ratio' => 'decimal:2',
        'ev_ebitda' => 'decimal:2',
        'peg_ratio' => 'decimal:2',
        'roe' => 'decimal:4',
        'dividend_yield' => 'decimal:4',
        'market_cap' => 'integer',
    ];

    public function stock(): BelongsTo
    {
        return $this->belongsTo(Stock::class);
    }

    // 평가 메서드
    public function getValuationGrade(): string
    {
        if ($this->forward_pe === null) {
            return 'N/A';
        }

        if ($this->forward_pe < 15) return 'Very Undervalued';
        if ($this->forward_pe < 25) return 'Undervalued';
        if ($this->forward_pe < 35) return 'Fair';
        return 'Overvalued';
    }

    public function getPegGrade(): string
    {
        if ($this->peg_ratio === null) {
            return 'N/A';
        }

        if ($this->peg_ratio < 0.5) return 'Excellent';
        if ($this->peg_ratio < 1.0) return 'Good';
        if ($this->peg_ratio < 2.0) return 'Fair';
        return 'Caution';
    }
}
```

### 4. StockPrice Model

`app/Models/StockPrice.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockPrice extends Model
{
    protected $fillable = [
        'stock_id',
        'date',
        'open',
        'high',
        'low',
        'close',
        'volume',
    ];

    protected $casts = [
        'date' => 'date',
        'open' => 'decimal:2',
        'high' => 'decimal:2',
        'low' => 'decimal:2',
        'close' => 'decimal:2',
        'volume' => 'integer',
    ];

    public function stock(): BelongsTo
    {
        return $this->belongsTo(Stock::class);
    }
}
```

---

## 외부 API 연동 서비스

### 1. Alpha Vantage Service

`app/Services/AlphaVantageService.php`:

```php
<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Models\ApiLog;

class AlphaVantageService
{
    private Client $client;
    private string $apiKey;
    private const BASE_URL = 'https://www.alphavantage.co/query';
    private const CACHE_TTL = 3600; // 1 hour

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 30,
            'verify' => false,
        ]);
        $this->apiKey = config('services.alpha_vantage.key');
    }

    /**
     * 종목 개요 정보 가져오기
     */
    public function getCompanyOverview(string $ticker): ?array
    {
        $cacheKey = "alpha_vantage_overview_{$ticker}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($ticker) {
            $startTime = microtime(true);

            try {
                $response = $this->client->get(self::BASE_URL, [
                    'query' => [
                        'function' => 'OVERVIEW',
                        'symbol' => $ticker,
                        'apikey' => $this->apiKey,
                    ],
                ]);

                $data = json_decode($response->getBody()->getContents(), true);
                
                $this->logApiCall(
                    'alpha_vantage',
                    $ticker,
                    'OVERVIEW',
                    200,
                    (int)((microtime(true) - $startTime) * 1000)
                );

                return $data;
            } catch (GuzzleException $e) {
                $this->logApiCall(
                    'alpha_vantage',
                    $ticker,
                    'OVERVIEW',
                    $e->getCode(),
                    (int)((microtime(true) - $startTime) * 1000),
                    $e->getMessage()
                );

                Log::error("Alpha Vantage API Error: {$e->getMessage()}");
                return null;
            }
        });
    }

    /**
     * 일별 가격 데이터
     */
    public function getDailyPrices(string $ticker, bool $compact = true): ?array
    {
        $cacheKey = "alpha_vantage_daily_{$ticker}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($ticker, $compact) {
            $startTime = microtime(true);

            try {
                $response = $this->client->get(self::BASE_URL, [
                    'query' => [
                        'function' => 'TIME_SERIES_DAILY',
                        'symbol' => $ticker,
                        'outputsize' => $compact ? 'compact' : 'full',
                        'apikey' => $this->apiKey,
                    ],
                ]);

                $data = json_decode($response->getBody()->getContents(), true);
                
                $this->logApiCall(
                    'alpha_vantage',
                    $ticker,
                    'TIME_SERIES_DAILY',
                    200,
                    (int)((microtime(true) - $startTime) * 1000)
                );

                return $data['Time Series (Daily)'] ?? null;
            } catch (GuzzleException $e) {
                $this->logApiCall(
                    'alpha_vantage',
                    $ticker,
                    'TIME_SERIES_DAILY',
                    $e->getCode(),
                    (int)((microtime(true) - $startTime) * 1000),
                    $e->getMessage()
                );

                Log::error("Alpha Vantage API Error: {$e->getMessage()}");
                return null;
            }
        });
    }

    /**
     * 밸류에이션 지표 추출
     */
    public function extractValuationMetrics(array $overview): array
    {
        return [
            'pe_ratio' => $this->parseFloat($overview['PERatio'] ?? null),
            'forward_pe' => $this->parseFloat($overview['ForwardPE'] ?? null),
            'pb_ratio' => $this->parseFloat($overview['PriceToBookRatio'] ?? null),
            'ps_ratio' => $this->parseFloat($overview['PriceToSalesRatioTTM'] ?? null),
            'peg_ratio' => $this->parseFloat($overview['PEGRatio'] ?? null),
            'dividend_yield' => $this->parseFloat($overview['DividendYield'] ?? null),
            'roe' => $this->parseFloat($overview['ReturnOnEquityTTM'] ?? null),
            'market_cap' => $this->parseInt($overview['MarketCapitalization'] ?? null),
        ];
    }

    private function parseFloat(?string $value): ?float
    {
        if ($value === null || $value === 'None' || $value === '-') {
            return null;
        }
        return (float) $value;
    }

    private function parseInt(?string $value): ?int
    {
        if ($value === null || $value === 'None' || $value === '-') {
            return null;
        }
        return (int) $value;
    }

    private function logApiCall(
        string $provider,
        string $ticker,
        string $endpoint,
        int $statusCode,
        int $responseTime,
        ?string $errorMessage = null
    ): void {
        ApiLog::create([
            'provider' => $provider,
            'ticker' => $ticker,
            'endpoint' => $endpoint,
            'status_code' => $statusCode,
            'response_time_ms' => $responseTime,
            'error_message' => $errorMessage,
        ]);
    }
}
```

### 2. Stock Data Sync Service

`app/Services/StockDataSyncService.php`:

```php
<?php

namespace App\Services;

use App\Models\Stock;
use App\Models\StockMetric;
use App\Models\StockPrice;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class StockDataSyncService
{
    public function __construct(
        private AlphaVantageService $alphaVantage
    ) {}

    /**
     * 단일 종목 데이터 동기화
     */
    public function syncStock(Stock $stock): bool
    {
        try {
            // 1. 개요 데이터 가져오기
            $overview = $this->alphaVantage->getCompanyOverview($stock->ticker);
            
            if (!$overview || empty($overview)) {
                Log::warning("No data for {$stock->ticker}");
                return false;
            }

            // 2. 밸류에이션 지표 저장
            $metrics = $this->alphaVantage->extractValuationMetrics($overview);
            
            StockMetric::updateOrCreate(
                [
                    'stock_id' => $stock->id,
                    'date' => Carbon::today(),
                ],
                [
                    'current_price' => $overview['Price'] ?? 0,
                    ...$metrics,
                ]
            );

            // 3. 가격 데이터 동기화
            $this->syncPrices($stock);

            Log::info("Successfully synced {$stock->ticker}");
            return true;

        } catch (\Exception $e) {
            Log::error("Error syncing {$stock->ticker}: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * 가격 데이터 동기화
     */
    private function syncPrices(Stock $stock): void
    {
        $dailyPrices = $this->alphaVantage->getDailyPrices($stock->ticker);

        if (!$dailyPrices) {
            return;
        }

        foreach ($dailyPrices as $date => $priceData) {
            StockPrice::updateOrCreate(
                [
                    'stock_id' => $stock->id,
                    'date' => Carbon::parse($date),
                ],
                [
                    'open' => $priceData['1. open'],
                    'high' => $priceData['2. high'],
                    'low' => $priceData['3. low'],
                    'close' => $priceData['4. close'],
                    'volume' => $priceData['5. volume'],
                ]
            );

            // 최근 100일만 동기화
            if (Carbon::parse($date)->diffInDays(Carbon::today()) > 100) {
                break;
            }
        }
    }

    /**
     * 모든 활성 종목 동기화
     */
    public function syncAllStocks(): void
    {
        $stocks = Stock::where('is_active', true)->get();

        foreach ($stocks as $stock) {
            $this->syncStock($stock);
            
            // API 레이트 리미트 준수 (Alpha Vantage: 5 calls/min)
            sleep(12); // 12초 대기
        }
    }
}
```

---

## API 엔드포인트 구현

### 1. API Routes

`routes/api.php`:

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\StockController;
use App\Http\Controllers\Api\V1\SectorController;
use App\Http\Controllers\Api\V1\ValuationController;

Route::prefix('v1')->group(function () {
    
    // 섹터
    Route::get('/sectors', [SectorController::class, 'index']);
    Route::get('/sectors/{sector}', [SectorController::class, 'show']);
    Route::get('/sectors/{sector}/stocks', [SectorController::class, 'stocks']);
    
    // 종목
    Route::get('/stocks', [StockController::class, 'index']);
    Route::get('/stocks/{ticker}', [StockController::class, 'show']);
    Route::get('/stocks/{ticker}/metrics', [StockController::class, 'metrics']);
    Route::get('/stocks/{ticker}/prices', [StockController::class, 'prices']);
    
    // 밸류에이션 분석
    Route::get('/valuation/overview', [ValuationController::class, 'overview']);
    Route::get('/valuation/undervalued', [ValuationController::class, 'undervalued']);
    Route::get('/valuation/compare', [ValuationController::class, 'compare']);
    Route::get('/valuation/sector-analysis', [ValuationController::class, 'sectorAnalysis']);
    
    // 데이터 동기화 (관리자 전용)
    Route::post('/admin/sync/{ticker?}', [StockController::class, 'sync'])
        ->middleware('auth:sanctum');
});
```

### 2. Stock Controller

`app/Http/Controllers/Api/V1/StockController.php`:

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use App\Services\StockDataSyncService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StockController extends Controller
{
    public function __construct(
        private StockDataSyncService $syncService
    ) {}

    /**
     * GET /api/v1/stocks
     * 종목 목록
     */
    public function index(Request $request): JsonResponse
    {
        $query = Stock::with(['sector', 'latestMetric']);

        // 섹터 필터
        if ($request->has('sector')) {
            $query->whereHas('sector', function ($q) use ($request) {
                $q->where('code', $request->sector);
            });
        }

        // 활성 종목만
        if ($request->boolean('active_only', true)) {
            $query->where('is_active', true);
        }

        $stocks = $query->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $stocks,
        ]);
    }

    /**
     * GET /api/v1/stocks/{ticker}
     * 종목 상세 정보
     */
    public function show(string $ticker): JsonResponse
    {
        $stock = Stock::with(['sector', 'latestMetric'])
            ->where('ticker', strtoupper($ticker))
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $stock->id,
                'ticker' => $stock->ticker,
                'name' => $stock->name,
                'exchange' => $stock->exchange,
                'sector' => $stock->sector->name,
                'is_active' => $stock->is_active,
                'latest_metrics' => $stock->latestMetric ? [
                    'date' => $stock->latestMetric->date,
                    'current_price' => $stock->latestMetric->current_price,
                    'pe_ratio' => $stock->latestMetric->pe_ratio,
                    'forward_pe' => $stock->latestMetric->forward_pe,
                    'pb_ratio' => $stock->latestMetric->pb_ratio,
                    'ps_ratio' => $stock->latestMetric->ps_ratio,
                    'ev_ebitda' => $stock->latestMetric->ev_ebitda,
                    'peg_ratio' => $stock->latestMetric->peg_ratio,
                    'roe' => $stock->latestMetric->roe,
                    'dividend_yield' => $stock->latestMetric->dividend_yield,
                    'market_cap' => $stock->latestMetric->market_cap,
                    'valuation_grade' => $stock->latestMetric->getValuationGrade(),
                    'peg_grade' => $stock->latestMetric->getPegGrade(),
                ] : null,
            ],
        ]);
    }

    /**
     * GET /api/v1/stocks/{ticker}/metrics?period=30
     * 지표 히스토리
     */
    public function metrics(Request $request, string $ticker): JsonResponse
    {
        $stock = Stock::where('ticker', strtoupper($ticker))->firstOrFail();

        $period = $request->input('period', 30);
        $startDate = now()->subDays($period);

        $metrics = $stock->metrics()
            ->where('date', '>=', $startDate)
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'ticker' => $ticker,
                'period' => $period,
                'metrics' => $metrics,
            ],
        ]);
    }

    /**
     * GET /api/v1/stocks/{ticker}/prices?period=90
     * 가격 히스토리
     */
    public function prices(Request $request, string $ticker): JsonResponse
    {
        $stock = Stock::where('ticker', strtoupper($ticker))->firstOrFail();

        $period = $request->input('period', 90);
        $startDate = now()->subDays($period);

        $prices = $stock->prices()
            ->where('date', '>=', $startDate)
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'ticker' => $ticker,
                'period' => $period,
                'prices' => $prices,
            ],
        ]);
    }

    /**
     * POST /api/v1/admin/sync/{ticker?}
     * 데이터 동기화
     */
    public function sync(Request $request, ?string $ticker = null): JsonResponse
    {
        if ($ticker) {
            $stock = Stock::where('ticker', strtoupper($ticker))->firstOrFail();
            $result = $this->syncService->syncStock($stock);

            return response()->json([
                'success' => $result,
                'message' => $result ? 'Sync completed' : 'Sync failed',
                'ticker' => $ticker,
            ]);
        }

        // 모든 종목 동기화 (백그라운드 처리)
        dispatch(function () {
            $this->syncService->syncAllStocks();
        });

        return response()->json([
            'success' => true,
            'message' => 'Sync job dispatched',
        ]);
    }
}
```

### 3. Valuation Controller

`app/Http/Controllers/Api/V1/ValuationController.php`:

```php
<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use App\Models\StockMetric;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ValuationController extends Controller
{
    /**
     * GET /api/v1/valuation/overview
     * 전체 시장 개요
     */
    public function overview(): JsonResponse
    {
        $today = now()->toDateString();

        $overview = StockMetric::where('date', $today)
            ->select([
                DB::raw('COUNT(*) as total_stocks'),
                DB::raw('AVG(pe_ratio) as avg_pe'),
                DB::raw('AVG(forward_pe) as avg_forward_pe'),
                DB::raw('AVG(pb_ratio) as avg_pb'),
                DB::raw('AVG(peg_ratio) as avg_peg'),
                DB::raw('AVG(roe) as avg_roe'),
                DB::raw('AVG(dividend_yield) as avg_dividend_yield'),
            ])
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $today,
                'market_overview' => $overview,
            ],
        ]);
    }

    /**
     * GET /api/v1/valuation/undervalued?min_forward_pe=15
     * 저평가 종목
     */
    public function undervalued(Request $request): JsonResponse
    {
        $maxForwardPe = $request->input('max_forward_pe', 20);
        $minPeg = $request->input('min_peg', 0);
        $maxPeg = $request->input('max_peg', 1.0);

        $stocks = Stock::with('latestMetric')
            ->whereHas('latestMetric', function ($query) use ($maxForwardPe, $minPeg, $maxPeg) {
                $query->where('forward_pe', '<=', $maxForwardPe)
                    ->where('forward_pe', '>', 0)
                    ->whereBetween('peg_ratio', [$minPeg, $maxPeg]);
            })
            ->get()
            ->map(function ($stock) {
                return [
                    'ticker' => $stock->ticker,
                    'name' => $stock->name,
                    'sector' => $stock->sector->name,
                    'current_price' => $stock->latestMetric->current_price,
                    'forward_pe' => $stock->latestMetric->forward_pe,
                    'peg_ratio' => $stock->latestMetric->peg_ratio,
                    'roe' => $stock->latestMetric->roe,
                    'valuation_grade' => $stock->latestMetric->getValuationGrade(),
                ];
            });

        return response()->json([
            'success' => true,
            'filters' => [
                'max_forward_pe' => $maxForwardPe,
                'peg_range' => [$minPeg, $maxPeg],
            ],
            'data' => $stocks,
        ]);
    }

    /**
     * GET /api/v1/valuation/compare?tickers=AAPL,MSFT,GOOGL
     * 종목 비교
     */
    public function compare(Request $request): JsonResponse
    {
        $request->validate([
            'tickers' => 'required|string',
        ]);

        $tickers = explode(',', strtoupper($request->tickers));

        $stocks = Stock::with('latestMetric')
            ->whereIn('ticker', $tickers)
            ->get()
            ->map(function ($stock) {
                return [
                    'ticker' => $stock->ticker,
                    'name' => $stock->name,
                    'metrics' => $stock->latestMetric,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $stocks,
        ]);
    }

    /**
     * GET /api/v1/valuation/sector-analysis
     * 섹터별 분석
     */
    public function sectorAnalysis(): JsonResponse
    {
        $today = now()->toDateString();

        $analysis = DB::table('stock_metrics')
            ->join('stocks', 'stocks.id', '=', 'stock_metrics.stock_id')
            ->join('sectors', 'sectors.id', '=', 'stocks.sector_id')
            ->where('stock_metrics.date', $today)
            ->select([
                'sectors.name as sector',
                'sectors.code as sector_code',
                DB::raw('COUNT(*) as stock_count'),
                DB::raw('AVG(stock_metrics.pe_ratio) as avg_pe'),
                DB::raw('AVG(stock_metrics.forward_pe) as avg_forward_pe'),
                DB::raw('AVG(stock_metrics.peg_ratio) as avg_peg'),
                DB::raw('AVG(stock_metrics.roe) as avg_roe'),
            ])
            ->groupBy('sectors.id', 'sectors.name', 'sectors.code')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $analysis,
        ]);
    }
}
```

---

## 자동화 스케줄링

### 1. Kernel 설정

`app/Console/Kernel.php`:

```php
<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // 평일 장 마감 후 데이터 동기화 (미국 동부시간 16:30 = 한국시간 06:30)
        $schedule->command('stocks:sync-all')
            ->dailyAt('06:30')
            ->weekdays()
            ->timezone('Asia/Seoul');

        // 주말 한번 전체 동기화
        $schedule->command('stocks:sync-all')
            ->weeklyOn(6, '10:00')
            ->timezone('Asia/Seoul');

        // 매 시간마다 가격 업데이트 (장중)
        $schedule->command('stocks:sync-prices')
            ->hourly()
            ->between('22:30', '05:00') // 미국 장 시간 (한국시간)
            ->weekdays();

        // 오래된 API 로그 삭제 (30일 이상)
        $schedule->command('logs:cleanup')
            ->daily();
    }
}
```

### 2. Sync Command

`app/Console/Commands/SyncStocksCommand.php`:

```bash
php artisan make:command SyncStocksCommand
```

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\StockDataSyncService;
use App\Models\Stock;

class SyncStocksCommand extends Command
{
    protected $signature = 'stocks:sync-all {--ticker=}';
    protected $description = 'Sync stock data from external APIs';

    public function handle(StockDataSyncService $syncService): int
    {
        $ticker = $this->option('ticker');

        if ($ticker) {
            $stock = Stock::where('ticker', strtoupper($ticker))->first();
            
            if (!$stock) {
                $this->error("Stock {$ticker} not found");
                return 1;
            }

            $this->info("Syncing {$ticker}...");
            $result = $syncService->syncStock($stock);
            
            $this->info($result ? 'Success!' : 'Failed!');
            return $result ? 0 : 1;
        }

        $this->info('Syncing all stocks...');
        $stocks = Stock::where('is_active', true)->get();
        
        $bar = $this->output->createProgressBar($stocks->count());
        $bar->start();

        foreach ($stocks as $stock) {
            $syncService->syncStock($stock);
            $bar->advance();
            sleep(12); // Rate limiting
        }

        $bar->finish();
        $this->newLine();
        $this->info('Sync completed!');

        return 0;
    }
}
```

### 3. 스케줄러 실행

개발 환경:
```bash
php artisan schedule:work
```

프로덕션 환경 (Cron):
```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

---

## 시드 데이터

### Database Seeder

`database/seeders/DatabaseSeeder.php`:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Sector;
use App\Models\Stock;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 섹터 생성
        $sectors = [
            ['name' => '반도체', 'code' => 'SEMICONDUCTOR', 'description' => '반도체 제조 및 설계'],
            ['name' => '스토리지', 'code' => 'STORAGE', 'description' => '데이터 저장 장치'],
            ['name' => '로봇', 'code' => 'ROBOTICS', 'description' => '자동화 및 로봇'],
            ['name' => '전력', 'code' => 'POWER', 'description' => '전력 생산 및 공급'],
            ['name' => 'IT서비스', 'code' => 'IT_SERVICES', 'description' => 'IT 서비스 및 소프트웨어'],
        ];

        foreach ($sectors as $sector) {
            Sector::create($sector);
        }

        // 종목 생성
        $stocks = [
            // 반도체
            ['sector' => 'SEMICONDUCTOR', 'ticker' => 'MU', 'name' => 'Micron Technology', 'exchange' => 'NASDAQ'],
            ['sector' => 'SEMICONDUCTOR', 'ticker' => 'NVDA', 'name' => 'NVIDIA', 'exchange' => 'NASDAQ'],
            ['sector' => 'SEMICONDUCTOR', 'ticker' => 'AMD', 'name' => 'AMD', 'exchange' => 'NASDAQ'],
            ['sector' => 'SEMICONDUCTOR', 'ticker' => 'AVGO', 'name' => 'Broadcom', 'exchange' => 'NASDAQ'],
            ['sector' => 'SEMICONDUCTOR', 'ticker' => 'QCOM', 'name' => 'Qualcomm', 'exchange' => 'NASDAQ'],
            
            // 스토리지
            ['sector' => 'STORAGE', 'ticker' => 'WDC', 'name' => 'Western Digital', 'exchange' => 'NASDAQ'],
            ['sector' => 'STORAGE', 'ticker' => 'STX', 'name' => 'Seagate', 'exchange' => 'NASDAQ'],
            
            // 로봇
            ['sector' => 'ROBOTICS', 'ticker' => 'SYM', 'name' => 'Symbotic', 'exchange' => 'NASDAQ'],
            ['sector' => 'ROBOTICS', 'ticker' => 'TER', 'name' => 'Teradyne', 'exchange' => 'NYSE'],
            
            // 전력
            ['sector' => 'POWER', 'ticker' => 'GEV', 'name' => 'GE Vernova', 'exchange' => 'NYSE'],
            ['sector' => 'POWER', 'ticker' => 'VST', 'name' => 'Vistra', 'exchange' => 'NYSE'],
            
            // IT서비스
            ['sector' => 'IT_SERVICES', 'ticker' => 'IBM', 'name' => 'IBM', 'exchange' => 'NYSE'],
        ];

        foreach ($stocks as $stockData) {
            $sector = Sector::where('code', $stockData['sector'])->first();
            
            Stock::create([
                'sector_id' => $sector->id,
                'ticker' => $stockData['ticker'],
                'name' => $stockData['name'],
                'exchange' => $stockData['exchange'],
                'is_active' => true,
            ]);
        }
    }
}
```

실행:
```bash
php artisan db:seed
```

---

## API 테스트

### 1. 종목 목록 조회
```bash
curl http://localhost:8000/api/v1/stocks
```

응답:
```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "ticker": "MU",
        "name": "Micron Technology",
        "sector": {
          "name": "반도체"
        },
        "latest_metric": {
          "current_price": "399.65",
          "forward_pe": "9.93",
          "peg_ratio": "0.35"
        }
      }
    ]
  }
}
```

### 2. 종목 상세 조회
```bash
curl http://localhost:8000/api/v1/stocks/NVDA
```

### 3. 저평가 종목 찾기
```bash
curl "http://localhost:8000/api/v1/valuation/undervalued?max_forward_pe=20&max_peg=1.0"
```

### 4. 섹터 분석
```bash
curl http://localhost:8000/api/v1/valuation/sector-analysis
```

---

## 배포

### .env.production 설정
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_DATABASE=stock_valuation
DB_USERNAME=your-username
DB_PASSWORD=your-password

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis

ALPHA_VANTAGE_API_KEY=your-production-key
```

### 배포 스크립트
```bash
#!/bin/bash
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:restart
```

---

## 다음 단계

1. ✅ **인증 추가**: Laravel Sanctum
2. ✅ **캐싱 전략**: Redis 활용
3. ✅ **API 문서**: Laravel Scramble 설정
4. ✅ **모니터링**: Laravel Telescope
5. ✅ **테스팅**: PHPUnit/Pest 테스트 작성

---

## 📚 참고 자료

- [Laravel 공식 문서](https://laravel.com/docs)
- [Alpha Vantage API](https://www.alphavantage.co/documentation/)
- [yfinance Python 라이브러리](https://github.com/ranaroussi/yfinance)
- [Laravel API 디자인 가이드](https://www.freecodecamp.org/news/rest-api-design-best-practices-build-a-rest-api/)
