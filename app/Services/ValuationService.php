<?php

namespace App\Services;

use App\Models\Stock;
use App\Models\StockFundamental;

class ValuationService
{
    /**
     * Calculate comprehensive valuation for a stock.
     *
     * @return array<string, mixed>
     */
    public function calculateValuation(Stock $stock): array
    {
        $fundamental = $stock->fundamentals()->latest('date')->first();
        $incomeStatements = $stock->financialStatements()
            ->income()
            ->orderBy('fiscal_date', 'desc')
            ->limit(5)
            ->get();

        if (! $fundamental) {
            return ['error' => 'No fundamental data available'];
        }

        $currentPrice = $fundamental->current_price;
        $eps = $fundamental->eps;
        $bookValue = $fundamental->book_value;
        $fcf = $fundamental->free_cashflow;
        $sharesOutstanding = $fundamental->market_cap && $currentPrice
            ? $fundamental->market_cap / $currentPrice
            : null;

        $valuations = [];

        // 1. PER 기반 적정가치 (업종 평균 PER 15~25 기준)
        if ($eps && $eps > 0) {
            $valuations['per_based'] = $this->calculatePerBasedValue($eps, $currentPrice);
        }

        // 2. PBR 기반 적정가치
        if ($bookValue && $bookValue > 0) {
            $valuations['pbr_based'] = $this->calculatePbrBasedValue($bookValue, $currentPrice);
        }

        // 3. DCF (Discounted Cash Flow) 간이 계산
        if ($fcf && $fcf > 0 && $sharesOutstanding) {
            $valuations['dcf_based'] = $this->calculateDcfValue($fcf, $sharesOutstanding, $currentPrice);
        }

        // 4. EPS 성장률 기반 (PEG)
        if ($eps && $fundamental->forward_eps && $fundamental->forward_eps > $eps) {
            $valuations['peg_based'] = $this->calculatePegBasedValue(
                $eps,
                $fundamental->forward_eps,
                $currentPrice
            );
        }

        // 5. 벤저민 그레이엄 공식
        if ($eps && $eps > 0) {
            $growthRate = $fundamental->earnings_growth ?? 0.05;
            $valuations['graham'] = $this->calculateGrahamValue($eps, $growthRate, $currentPrice);
        }

        // 종합 평가 (가중 평균)
        $avgFairValue = $this->calculateWeightedFairValue($valuations);
        $overallRating = $this->calculateOverallRating($currentPrice, $avgFairValue, $fundamental);

        return [
            'ticker' => $stock->ticker,
            'current_price' => $currentPrice,
            'valuations' => $valuations,
            'average_fair_value' => $avgFairValue ? round($avgFairValue, 2) : null,
            'upside_potential' => $avgFairValue && $currentPrice
                ? round((($avgFairValue - $currentPrice) / $currentPrice) * 100, 2)
                : null,
            'overall_rating' => $overallRating,
            'fundamental_summary' => $this->getFundamentalSummary($fundamental),
            'financial_health' => $this->assessFinancialHealth($fundamental),
        ];
    }

    /**
     * PER 기반 적정가치 계산
     */
    private function calculatePerBasedValue(float $eps, ?float $currentPrice): array
    {
        // 업종별 평균 PER 범위 (테크: 20-30, 일반: 15-20)
        $conservativePer = 15;
        $fairPer = 20;
        $optimisticPer = 25;

        $conservativeValue = $eps * $conservativePer;
        $fairValue = $eps * $fairPer;
        $optimisticValue = $eps * $optimisticPer;

        return [
            'method' => 'PER 기반',
            'conservative' => round($conservativeValue, 2),
            'fair_value' => round($fairValue, 2),
            'optimistic' => round($optimisticValue, 2),
            'current_per' => $currentPrice && $eps > 0 ? round($currentPrice / $eps, 2) : null,
            'assessment' => $this->assessValue($currentPrice, $fairValue),
        ];
    }

    /**
     * PBR 기반 적정가치 계산
     */
    private function calculatePbrBasedValue(float $bookValue, ?float $currentPrice): array
    {
        // 기술주 PBR 기준 (2-5 적정)
        $conservativePbr = 2;
        $fairPbr = 3;
        $optimisticPbr = 5;

        $conservativeValue = $bookValue * $conservativePbr;
        $fairValue = $bookValue * $fairPbr;
        $optimisticValue = $bookValue * $optimisticPbr;

        return [
            'method' => 'PBR 기반',
            'conservative' => round($conservativeValue, 2),
            'fair_value' => round($fairValue, 2),
            'optimistic' => round($optimisticValue, 2),
            'current_pbr' => $currentPrice && $bookValue > 0 ? round($currentPrice / $bookValue, 2) : null,
            'assessment' => $this->assessValue($currentPrice, $fairValue),
        ];
    }

    /**
     * DCF 간이 계산
     */
    private function calculateDcfValue(float $fcf, float $sharesOutstanding, ?float $currentPrice): array
    {
        // 할인율 10%, 성장률 5%, 영구성장률 2%
        $discountRate = 0.10;
        $growthRate = 0.05;
        $terminalGrowthRate = 0.02;
        $years = 10;

        $presentValue = 0;
        $projectedFcf = $fcf;

        for ($i = 1; $i <= $years; $i++) {
            $projectedFcf *= (1 + $growthRate);
            $presentValue += $projectedFcf / pow(1 + $discountRate, $i);
        }

        // 터미널 밸류
        $terminalValue = ($projectedFcf * (1 + $terminalGrowthRate)) / ($discountRate - $terminalGrowthRate);
        $presentTerminalValue = $terminalValue / pow(1 + $discountRate, $years);

        $totalValue = $presentValue + $presentTerminalValue;
        $fairValuePerShare = $totalValue / $sharesOutstanding;

        return [
            'method' => 'DCF (현금흐름할인)',
            'fair_value' => round($fairValuePerShare, 2),
            'fcf_per_share' => round($fcf / $sharesOutstanding, 2),
            'assessment' => $this->assessValue($currentPrice, $fairValuePerShare),
        ];
    }

    /**
     * PEG 기반 적정가치
     */
    private function calculatePegBasedValue(float $eps, float $forwardEps, ?float $currentPrice): array
    {
        $growthRate = (($forwardEps - $eps) / $eps) * 100;
        $fairPeg = 1.0; // PEG 1.0이 적정

        // 적정 PER = 성장률 * PEG
        $fairPer = $growthRate * $fairPeg;
        $fairValue = $eps * $fairPer;

        $currentPeg = null;
        if ($currentPrice && $eps > 0 && $growthRate > 0) {
            $currentPer = $currentPrice / $eps;
            $currentPeg = $currentPer / $growthRate;
        }

        return [
            'method' => 'PEG 기반',
            'fair_value' => round($fairValue, 2),
            'growth_rate' => round($growthRate, 2),
            'current_peg' => $currentPeg ? round($currentPeg, 2) : null,
            'assessment' => $this->assessValue($currentPrice, $fairValue),
        ];
    }

    /**
     * 벤저민 그레이엄 공식
     * V = EPS × (8.5 + 2g) × 4.4 / Y
     */
    private function calculateGrahamValue(float $eps, float $growthRate, ?float $currentPrice): array
    {
        $g = $growthRate * 100; // 퍼센트로 변환
        $y = 4.4; // AAA 채권 수익률 (현재 기준)

        $fairValue = $eps * (8.5 + 2 * $g) * 4.4 / $y;

        return [
            'method' => '그레이엄 공식',
            'fair_value' => round($fairValue, 2),
            'formula' => "EPS({$eps}) × (8.5 + 2×{$g}%) × 4.4 / {$y}",
            'assessment' => $this->assessValue($currentPrice, $fairValue),
        ];
    }

    private function assessValue(?float $currentPrice, float $fairValue): string
    {
        if (! $currentPrice) {
            return 'N/A';
        }

        $ratio = $currentPrice / $fairValue;

        if ($ratio < 0.8) {
            return '매우 저평가';
        }
        if ($ratio < 0.95) {
            return '저평가';
        }
        if ($ratio <= 1.05) {
            return '적정';
        }
        if ($ratio <= 1.2) {
            return '고평가';
        }

        return '매우 고평가';
    }

    /**
     * 가중 평균 적정가치 계산
     * DCF가 가장 신뢰도 높고, PER/PBR은 시장 기반, PEG/Graham은 보조 지표
     */
    private function calculateWeightedFairValue(array $valuations): ?float
    {
        $weights = [
            'dcf_based' => 0.30,   // DCF: 현금흐름 기반, 가장 신뢰도 높음
            'per_based' => 0.25,   // PER: 수익 기반, 널리 사용됨
            'pbr_based' => 0.15,   // PBR: 자산 기반
            'peg_based' => 0.15,   // PEG: 성장률 반영
            'graham' => 0.15,      // Graham: 보수적 가치투자 관점
        ];

        $weightedSum = 0;
        $totalWeight = 0;

        foreach ($valuations as $key => $valuation) {
            if (isset($valuation['fair_value']) && isset($weights[$key])) {
                $weightedSum += $valuation['fair_value'] * $weights[$key];
                $totalWeight += $weights[$key];
            }
        }

        return $totalWeight > 0 ? $weightedSum / $totalWeight : null;
    }

    private function calculateOverallRating(?float $currentPrice, ?float $avgFairValue, StockFundamental $fundamental): array
    {
        $score = 50; // 기본 점수
        $reasons = [];

        if ($currentPrice && $avgFairValue) {
            $ratio = $currentPrice / $avgFairValue;
            if ($ratio < 0.8) {
                $score += 20;
                $reasons[] = '현재가가 적정가 대비 20% 이상 저평가';
            } elseif ($ratio < 0.95) {
                $score += 10;
                $reasons[] = '현재가가 적정가 대비 저평가';
            } elseif ($ratio > 1.2) {
                $score -= 20;
                $reasons[] = '현재가가 적정가 대비 20% 이상 고평가';
            } elseif ($ratio > 1.05) {
                $score -= 10;
                $reasons[] = '현재가가 적정가 대비 고평가';
            }
        }

        // ROE 평가
        if ($fundamental->roe) {
            if ($fundamental->roe > 0.2) {
                $score += 10;
                $reasons[] = 'ROE 20% 이상 (우수)';
            } elseif ($fundamental->roe > 0.15) {
                $score += 5;
                $reasons[] = 'ROE 15% 이상 (양호)';
            } elseif ($fundamental->roe < 0.05) {
                $score -= 10;
                $reasons[] = 'ROE 5% 미만 (저조)';
            }
        }

        // 부채비율 평가
        if ($fundamental->debt_to_equity !== null) {
            if ($fundamental->debt_to_equity < 50) {
                $score += 5;
                $reasons[] = '부채비율 50% 미만 (건전)';
            } elseif ($fundamental->debt_to_equity > 150) {
                $score -= 10;
                $reasons[] = '부채비율 150% 초과 (위험)';
            }
        }

        // 성장률 평가
        if ($fundamental->revenue_growth) {
            if ($fundamental->revenue_growth > 0.2) {
                $score += 10;
                $reasons[] = '매출 성장률 20% 이상';
            } elseif ($fundamental->revenue_growth > 0.1) {
                $score += 5;
                $reasons[] = '매출 성장률 10% 이상';
            } elseif ($fundamental->revenue_growth < 0) {
                $score -= 10;
                $reasons[] = '매출 감소';
            }
        }

        $score = max(0, min(100, $score));

        $rating = match (true) {
            $score >= 80 => '매수 추천',
            $score >= 60 => '매수 고려',
            $score >= 40 => '보유',
            $score >= 20 => '매도 고려',
            default => '매도 추천',
        };

        return [
            'score' => $score,
            'rating' => $rating,
            'reasons' => $reasons,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function getFundamentalSummary(StockFundamental $fundamental): array
    {
        return [
            'market_cap' => $fundamental->market_cap,
            'pe_ratio' => $fundamental->pe_ratio,
            'forward_pe' => $fundamental->forward_pe,
            'pb_ratio' => $fundamental->pb_ratio,
            'ps_ratio' => $fundamental->ps_ratio,
            'ev_ebitda' => $fundamental->ev_ebitda,
            'roe' => $fundamental->roe ? round($fundamental->roe * 100, 2) : null,
            'profit_margin' => $fundamental->profit_margin ? round($fundamental->profit_margin * 100, 2) : null,
            'revenue_growth' => $fundamental->revenue_growth ? round($fundamental->revenue_growth * 100, 2) : null,
            'eps' => $fundamental->eps,
            'dividend_yield' => $fundamental->dividend_yield ? round($fundamental->dividend_yield * 100, 2) : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function assessFinancialHealth(StockFundamental $fundamental): array
    {
        $health = [
            'current_ratio' => [
                'value' => $fundamental->current_ratio,
                'status' => $this->assessCurrentRatio($fundamental->current_ratio),
            ],
            'debt_to_equity' => [
                'value' => $fundamental->debt_to_equity,
                'status' => $this->assessDebtToEquity($fundamental->debt_to_equity),
            ],
            'quick_ratio' => [
                'value' => $fundamental->quick_ratio,
                'status' => $this->assessQuickRatio($fundamental->quick_ratio),
            ],
        ];

        $statuses = array_column($health, 'status');
        $goodCount = count(array_filter($statuses, fn ($s) => $s === '양호'));

        $health['overall'] = match (true) {
            $goodCount >= 3 => '건전',
            $goodCount >= 2 => '양호',
            $goodCount >= 1 => '보통',
            default => '주의',
        };

        return $health;
    }

    private function assessCurrentRatio(?float $value): string
    {
        if ($value === null) {
            return 'N/A';
        }

        return $value >= 1.5 ? '양호' : ($value >= 1.0 ? '보통' : '주의');
    }

    private function assessDebtToEquity(?float $value): string
    {
        if ($value === null) {
            return 'N/A';
        }

        return $value < 100 ? '양호' : ($value < 200 ? '보통' : '주의');
    }

    private function assessQuickRatio(?float $value): string
    {
        if ($value === null) {
            return 'N/A';
        }

        return $value >= 1.0 ? '양호' : ($value >= 0.5 ? '보통' : '주의');
    }
}
