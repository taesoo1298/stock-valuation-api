import { Head, Link } from '@inertiajs/react';

interface Sector {
    id: number;
    name: string;
    code: string;
}

interface Stock {
    id: number;
    ticker: string;
    name: string;
    exchange: string;
    sector: Sector;
}

interface Fundamental {
    current_price: number | null;
    market_cap: number | null;
    pe_ratio: number | null;
    forward_pe: number | null;
    pb_ratio: number | null;
    ps_ratio: number | null;
    ev_ebitda: number | null;
    roe: number | null;
    profit_margin: number | null;
    revenue_growth: number | null;
    eps: number | null;
    dividend_yield: number | null;
    debt_to_equity: number | null;
    current_ratio: number | null;
    free_cashflow: number | null;
    beta: number | null;
}

interface Financial {
    fiscal_date: string;
    total_revenue: number | null;
    gross_profit: number | null;
    operating_income: number | null;
    net_income: number | null;
    basic_eps: number | null;
}

interface Cashflow {
    fiscal_date: string;
    operating_cashflow: number | null;
    free_cashflow: number | null;
    capex: number | null;
}

interface Price {
    date: string;
    close: number | null;
    volume: number | null;
}

interface OptionSummary {
    option_type: 'call' | 'put';
    expiration_date: string;
    count: number;
    total_volume: number | null;
    total_open_interest: number | null;
}

interface InstitutionalHolder {
    holder_name: string;
    shares: number | null;
    date_reported: string | null;
    percent_out: number | null;
    value: number | null;
}

interface InsiderTransaction {
    insider_name: string;
    position: string | null;
    transaction_type: string | null;
    transaction_date: string | null;
    shares: number | null;
    value: number | null;
}

interface EarningsEstimate {
    estimate_type: 'eps' | 'revenue';
    period: string;
    estimate_avg: number | null;
    estimate_low: number | null;
    estimate_high: number | null;
    year_ago_value: number | null;
    number_of_analysts: number | null;
    growth: number | null;
}

interface EarningsHistory {
    earnings_date: string;
    eps_estimate: number | null;
    reported_eps: number | null;
    surprise_percent: number | null;
}

interface AnalystRating {
    target_high: number | null;
    target_low: number | null;
    target_mean: number | null;
    target_median: number | null;
    strong_buy: number;
    buy: number;
    hold: number;
    sell: number;
    strong_sell: number;
    next_earnings_date: string | null;
    next_eps_estimate: number | null;
    total_recommendations: number;
    consensus: string;
}

interface SectorBenchmark {
    etf_ticker: string;
    sector_name: string;
    sector_name_kr: string;
    trailing_pe: number | null;
    forward_pe: number | null;
    pb_ratio: number | null;
    dividend_yield: number | null;
}

interface ValuationMethod {
    method: string;
    fair_value: number;
    conservative?: number;
    optimistic?: number;
    assessment: string;
    current_per?: number;
    current_pbr?: number;
    current_peg?: number;
}

interface OverallRating {
    score: number;
    rating: string;
    reasons: string[];
}

interface FinancialHealth {
    current_ratio: { value: number | null; status: string };
    debt_to_equity: { value: number | null; status: string };
    quick_ratio: { value: number | null; status: string };
    overall: string;
}

interface Valuation {
    ticker: string;
    current_price: number | null;
    valuations: Record<string, ValuationMethod>;
    average_fair_value: number | null;
    upside_potential: number | null;
    overall_rating: OverallRating;
    fundamental_summary: Record<string, number | null>;
    financial_health: FinancialHealth;
    error?: string;
}

interface Props {
    stock: Stock;
    fundamental: Fundamental | null;
    financials: Financial[];
    cashflows: Cashflow[];
    prices: Price[];
    options: OptionSummary[];
    institutionalHolders: InstitutionalHolder[];
    insiderTransactions: InsiderTransaction[];
    earningsEstimates: EarningsEstimate[];
    earningsHistories: EarningsHistory[];
    analystRating: AnalystRating | null;
    sectorBenchmark: SectorBenchmark | null;
    valuation: Valuation;
}

function formatMarketCap(value: number | null): string {
    if (!value) return '-';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
}

function formatNumber(value: number | null, decimals = 2): string {
    if (value === null || value === undefined) return '-';
    return Number(value).toFixed(decimals);
}

function formatPercent(value: number | null): string {
    if (value === null || value === undefined) return '-';
    return `${Number(value).toFixed(1)}%`;
}

function getRatingColor(rating: string): string {
    switch (rating) {
        case '매수 추천':
            return 'text-green-600 dark:text-green-400';
        case '매수 고려':
            return 'text-green-500 dark:text-green-500';
        case '보유':
            return 'text-yellow-600 dark:text-yellow-400';
        case '매도 고려':
            return 'text-orange-500 dark:text-orange-400';
        case '매도 추천':
            return 'text-red-600 dark:text-red-400';
        default:
            return 'text-gray-600 dark:text-gray-400';
    }
}

function getAssessmentColor(assessment: string): string {
    switch (assessment) {
        case '매우 저평가':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case '저평가':
            return 'bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300';
        case '적정':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
        case '고평가':
            return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
        case '매우 고평가':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
}

function getHealthColor(status: string): string {
    switch (status) {
        case '양호':
            return 'text-green-600 dark:text-green-400';
        case '보통':
            return 'text-yellow-600 dark:text-yellow-400';
        case '주의':
            return 'text-red-600 dark:text-red-400';
        default:
            return 'text-gray-600 dark:text-gray-400';
    }
}

interface MethodDescription {
    formula: string;
    description: string;
}

function getMethodDescription(key: string): MethodDescription {
    const descriptions: Record<string, MethodDescription> = {
        per_based: {
            formula: '적정가치 = EPS × 적정 PER',
            description: '주당순이익(EPS)에 업종 평균 PER(15~25)을 곱하여 산출. 보수적 15배, 적정 20배, 낙관적 25배 적용.',
        },
        pbr_based: {
            formula: '적정가치 = 주당순자산 × 적정 PBR',
            description: '주당순자산(BPS)에 적정 PBR을 곱하여 산출. 기술주 기준 보수적 2배, 적정 3배, 낙관적 5배 적용.',
        },
        dcf_based: {
            formula: 'DCF = Σ(FCF × (1+g)ⁿ / (1+r)ⁿ) + 터미널밸류',
            description: '향후 10년간 잉여현금흐름(FCF)을 할인율 10%, 성장률 5%로 현재가치화. 터미널 성장률 2% 적용.',
        },
        peg_based: {
            formula: '적정 PER = EPS 성장률(%) × PEG',
            description: 'PEG 1.0을 적정으로 보고, 성장률에 비례한 PER을 적용하여 산출. PEG < 1이면 저평가.',
        },
        graham: {
            formula: 'V = EPS × (8.5 + 2g) × 4.4 / Y',
            description: '벤저민 그레이엄의 성장주 공식. 8.5는 무성장 기업 PER, g는 성장률(%), Y는 AAA채권 수익률(4.4%).',
        },
    };
    return descriptions[key] || { formula: '-', description: '-' };
}

export default function StockShow({ stock, fundamental, financials, cashflows, prices, options, institutionalHolders, insiderTransactions, earningsEstimates, earningsHistories, analystRating, sectorBenchmark, valuation }: Props) {
    const hasData = !!fundamental && !valuation.error;

    return (
        <>
            <Head title={`${stock.ticker} - 밸류에이션 분석`} />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Back Link */}
                    <Link
                        href="/stocks"
                        className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        목록으로
                    </Link>

                    {/* Header */}
                    <div className="mb-8 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{stock.ticker}</h1>
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {stock.exchange}
                                </span>
                                <Link
                                    href={`/stocks/${stock.ticker}/story`}
                                    className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800"
                                >
                                    StockStory
                                </Link>
                            </div>
                            <p className="mt-1 text-xl text-gray-600 dark:text-gray-400">{stock.name}</p>
                            <p className="mt-1 text-sm text-gray-500">섹터: {stock.sector?.name}</p>
                        </div>
                        {hasData && valuation.current_price && (
                            <div className="text-right">
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                    ${formatNumber(valuation.current_price)}
                                </p>
                                {valuation.upside_potential !== null && (
                                    <p className={`text-lg font-medium ${valuation.upside_potential >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {valuation.upside_potential >= 0 ? '+' : ''}{formatNumber(valuation.upside_potential)}% 상승여력
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {!hasData ? (
                        <div className="rounded-lg bg-yellow-50 p-6 text-center dark:bg-yellow-900/20">
                            <p className="text-yellow-800 dark:text-yellow-200">
                                데이터가 없습니다. 먼저 동기화를 실행해 주세요.
                            </p>
                            <code className="mt-2 block text-sm text-yellow-600 dark:text-yellow-400">
                                php artisan stocks:sync-yahoo --ticker={stock.ticker}
                            </code>
                        </div>
                    ) : (
                        <>
                            {/* Overall Rating Card */}
                            <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">종합 평가</h2>
                                <div className="grid gap-6 md:grid-cols-3">
                                    <div className="text-center">
                                        <div className="text-5xl font-bold text-gray-900 dark:text-white">
                                            {valuation.overall_rating.score}
                                        </div>
                                        <div className={`mt-2 text-xl font-semibold ${getRatingColor(valuation.overall_rating.rating)}`}>
                                            {valuation.overall_rating.rating}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <div className="mb-2 font-medium text-gray-700 dark:text-gray-300">평가 근거</div>
                                        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                            {valuation.overall_rating.reasons.map((reason, idx) => (
                                                <li key={idx} className="flex items-center">
                                                    <span className="mr-2 text-green-500">•</span>
                                                    {reason}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-6 dark:border-gray-700 md:grid-cols-4">
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">적정가치 (평균)</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            ${formatNumber(valuation.average_fair_value)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">현재가</p>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                            ${formatNumber(valuation.current_price)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">상승여력</p>
                                        <p className={`text-lg font-semibold ${(valuation.upside_potential ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {valuation.upside_potential !== null ? `${valuation.upside_potential >= 0 ? '+' : ''}${formatNumber(valuation.upside_potential)}%` : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">재무 건전성</p>
                                        <p className={`text-lg font-semibold ${getHealthColor(valuation.financial_health.overall)}`}>
                                            {valuation.financial_health.overall}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Valuation Methods */}
                            <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">적정가치 분석</h2>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {Object.entries(valuation.valuations).map(([key, method]) => {
                                        const methodDesc = getMethodDescription(key);
                                        return (
                                            <div key={key} className="rounded-lg border p-4 dark:border-gray-700">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className="font-medium text-gray-900 dark:text-white">{method.method}</span>
                                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getAssessmentColor(method.assessment)}`}>
                                                        {method.assessment}
                                                    </span>
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    ${formatNumber(method.fair_value)}
                                                </div>
                                                {method.conservative && method.optimistic && (
                                                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                        보수적: ${formatNumber(method.conservative)} ~ 낙관적: ${formatNumber(method.optimistic)}
                                                    </div>
                                                )}
                                                <div className="mt-3 border-t pt-3 dark:border-gray-600">
                                                    <div className="mb-1 font-mono text-xs text-blue-600 dark:text-blue-400">
                                                        {methodDesc.formula}
                                                    </div>
                                                    <div className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                                                        {methodDesc.description}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sector Benchmark Comparison */}
                            {sectorBenchmark && fundamental?.pe_ratio && (
                                <div className="mb-8 rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                                        섹터 평균 대비 밸류에이션
                                        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                            ({sectorBenchmark.sector_name_kr} - {sectorBenchmark.etf_ticker})
                                        </span>
                                    </h2>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        {/* PER Comparison */}
                                        <div className="rounded-lg border p-4 dark:border-gray-700">
                                            <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">PER 비교</h4>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-gray-500 dark:text-gray-400">현재 PER</span>
                                                <span className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {formatNumber(fundamental.pe_ratio)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-gray-500 dark:text-gray-400">섹터 평균 PER</span>
                                                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                    {formatNumber(sectorBenchmark.trailing_pe)}
                                                </span>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="absolute left-1/2 w-0.5 h-full bg-blue-500 z-10"
                                                    title="섹터 평균"
                                                />
                                                <div
                                                    className={`h-full ${fundamental.pe_ratio <= (sectorBenchmark.trailing_pe ?? 0) ? 'bg-green-500' : 'bg-red-500'}`}
                                                    style={{
                                                        width: `${Math.min((fundamental.pe_ratio / ((sectorBenchmark.trailing_pe ?? 1) * 2)) * 100, 100)}%`
                                                    }}
                                                />
                                            </div>
                                            <div className="mt-3 text-center">
                                                {(() => {
                                                    const diff = ((fundamental.pe_ratio - (sectorBenchmark.trailing_pe ?? 0)) / (sectorBenchmark.trailing_pe ?? 1)) * 100;
                                                    const isUndervalued = diff < -10;
                                                    const isOvervalued = diff > 10;
                                                    return (
                                                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                                                            isUndervalued
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                : isOvervalued
                                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                        }`}>
                                                            {isUndervalued && '저평가'}
                                                            {isOvervalued && '고평가'}
                                                            {!isUndervalued && !isOvervalued && '적정'}
                                                            <span className="ml-1">
                                                                ({diff >= 0 ? '+' : ''}{formatNumber(diff, 1)}%)
                                                            </span>
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        {/* PBR Comparison */}
                                        {fundamental.pb_ratio && sectorBenchmark.pb_ratio && sectorBenchmark.pb_ratio > 0 && sectorBenchmark.pb_ratio < 50 && (
                                            <div className="rounded-lg border p-4 dark:border-gray-700">
                                                <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">PBR 비교</h4>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-gray-500 dark:text-gray-400">현재 PBR</span>
                                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                                        {formatNumber(fundamental.pb_ratio)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-gray-500 dark:text-gray-400">섹터 평균 PBR</span>
                                                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                        {formatNumber(sectorBenchmark.pb_ratio)}
                                                    </span>
                                                </div>
                                                {/* Progress Bar */}
                                                <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="absolute left-1/2 w-0.5 h-full bg-blue-500 z-10"
                                                        title="섹터 평균"
                                                    />
                                                    <div
                                                        className={`h-full ${fundamental.pb_ratio <= sectorBenchmark.pb_ratio ? 'bg-green-500' : 'bg-red-500'}`}
                                                        style={{
                                                            width: `${Math.min((fundamental.pb_ratio / (sectorBenchmark.pb_ratio * 2)) * 100, 100)}%`
                                                        }}
                                                    />
                                                </div>
                                                <div className="mt-3 text-center">
                                                    {(() => {
                                                        const diff = ((fundamental.pb_ratio - sectorBenchmark.pb_ratio) / sectorBenchmark.pb_ratio) * 100;
                                                        const isUndervalued = diff < -10;
                                                        const isOvervalued = diff > 10;
                                                        return (
                                                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                                                                isUndervalued
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                    : isOvervalued
                                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                            }`}>
                                                                {isUndervalued && '저평가'}
                                                                {isOvervalued && '고평가'}
                                                                {!isUndervalued && !isOvervalued && '적정'}
                                                                <span className="ml-1">
                                                                    ({diff >= 0 ? '+' : ''}{formatNumber(diff, 1)}%)
                                                                </span>
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Key Metrics Grid */}
                            <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {/* Valuation Metrics */}
                                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                    <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">밸류에이션</h3>
                                    <dl className="space-y-2">
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">PER</dt>
                                            <dd className="font-medium text-gray-900 dark:text-white">{formatNumber(fundamental?.pe_ratio)}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">Forward PER</dt>
                                            <dd className="font-medium text-gray-900 dark:text-white">{formatNumber(fundamental?.forward_pe)}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">PBR</dt>
                                            <dd className="font-medium text-gray-900 dark:text-white">{formatNumber(fundamental?.pb_ratio)}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">PSR</dt>
                                            <dd className="font-medium text-gray-900 dark:text-white">{formatNumber(fundamental?.ps_ratio)}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">EV/EBITDA</dt>
                                            <dd className="font-medium text-gray-900 dark:text-white">{formatNumber(fundamental?.ev_ebitda)}</dd>
                                        </div>
                                    </dl>
                                </div>

                                {/* Profitability */}
                                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                    <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">수익성</h3>
                                    <dl className="space-y-2">
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">ROE</dt>
                                            <dd className="font-medium text-gray-900 dark:text-white">
                                                {fundamental?.roe ? formatPercent(fundamental.roe * 100) : '-'}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">이익률</dt>
                                            <dd className="font-medium text-gray-900 dark:text-white">
                                                {fundamental?.profit_margin ? formatPercent(fundamental.profit_margin * 100) : '-'}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">매출 성장률</dt>
                                            <dd className="font-medium text-gray-900 dark:text-white">
                                                {fundamental?.revenue_growth ? formatPercent(fundamental.revenue_growth * 100) : '-'}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">EPS</dt>
                                            <dd className="font-medium text-gray-900 dark:text-white">${formatNumber(fundamental?.eps)}</dd>
                                        </div>
                                    </dl>
                                </div>

                                {/* Financial Health */}
                                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                    <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">재무 건전성</h3>
                                    <dl className="space-y-2">
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">유동비율</dt>
                                            <dd className={`font-medium ${getHealthColor(valuation.financial_health.current_ratio.status)}`}>
                                                {formatNumber(valuation.financial_health.current_ratio.value)}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">부채비율</dt>
                                            <dd className={`font-medium ${getHealthColor(valuation.financial_health.debt_to_equity.status)}`}>
                                                {formatNumber(valuation.financial_health.debt_to_equity.value)}%
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">당좌비율</dt>
                                            <dd className={`font-medium ${getHealthColor(valuation.financial_health.quick_ratio.status)}`}>
                                                {formatNumber(valuation.financial_health.quick_ratio.value)}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">Beta</dt>
                                            <dd className="font-medium text-gray-900 dark:text-white">{formatNumber(fundamental?.beta)}</dd>
                                        </div>
                                    </dl>
                                </div>

                                {/* Cash & Dividend */}
                                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                    <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">현금 & 배당</h3>
                                    <dl className="space-y-2">
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">시가총액</dt>
                                            <dd className="font-medium text-gray-900 dark:text-white">{formatMarketCap(fundamental?.market_cap)}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">FCF</dt>
                                            <dd className="font-medium text-gray-900 dark:text-white">{formatMarketCap(fundamental?.free_cashflow)}</dd>
                                        </div>
                                        <div className="flex justify-between">
                                            <dt className="text-gray-500 dark:text-gray-400">배당수익률</dt>
                                            <dd className="font-medium text-gray-900 dark:text-white">
                                                {fundamental?.dividend_yield ? formatPercent(fundamental.dividend_yield * 100) : '-'}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>

                            {/* Price Chart */}
                            {prices.length > 0 && (
                                <div className="mb-8 rounded-lg bg-white shadow dark:bg-gray-800">
                                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">주가 추이 (1년)</h2>
                                    </div>
                                    <div className="p-6">
                                        {/* Simple Line Chart */}
                                        <div className="relative h-64 w-full">
                                            {(() => {
                                                const sortedPrices = [...prices].reverse();
                                                const validPrices = sortedPrices.filter(p => p.close !== null);
                                                if (validPrices.length < 2) return null;

                                                const closes = validPrices.map(p => p.close as number);
                                                const minPrice = Math.min(...closes);
                                                const maxPrice = Math.max(...closes);
                                                const priceRange = maxPrice - minPrice || 1;

                                                const width = 100;
                                                const height = 100;
                                                const padding = 5;

                                                const points = validPrices.map((p, i) => {
                                                    const x = padding + (i / (validPrices.length - 1)) * (width - 2 * padding);
                                                    const y = height - padding - ((p.close as number - minPrice) / priceRange) * (height - 2 * padding);
                                                    return `${x},${y}`;
                                                }).join(' ');

                                                const firstPrice = closes[0];
                                                const lastPrice = closes[closes.length - 1];
                                                const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
                                                const isPositive = priceChange >= 0;

                                                // 선형 회귀 계산 (5년 추세선)
                                                const n = closes.length;
                                                const sumX = (n * (n - 1)) / 2;
                                                const sumY = closes.reduce((a, b) => a + b, 0);
                                                const sumXY = closes.reduce((sum, y, x) => sum + x * y, 0);
                                                const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
                                                const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
                                                const intercept = (sumY - slope * sumX) / n;

                                                // 추세선 시작/끝 좌표
                                                const trendStart = intercept;
                                                const trendEnd = slope * (n - 1) + intercept;
                                                const trendStartY = height - padding - ((trendStart - minPrice) / priceRange) * (height - 2 * padding);
                                                const trendEndY = height - padding - ((trendEnd - minPrice) / priceRange) * (height - 2 * padding);
                                                const trendIsPositive = slope >= 0;

                                                // 1년 수익률 계산
                                                const annualReturn = priceChange;

                                                return (
                                                    <>
                                                        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
                                                            <defs>
                                                                <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                                    <stop offset="0%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity="0.3" />
                                                                    <stop offset="100%" stopColor={isPositive ? '#10B981' : '#EF4444'} stopOpacity="0" />
                                                                </linearGradient>
                                                            </defs>
                                                            {/* Area fill */}
                                                            <polygon
                                                                points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
                                                                fill="url(#priceGradient)"
                                                            />
                                                            {/* Line */}
                                                            <polyline
                                                                points={points}
                                                                fill="none"
                                                                stroke={isPositive ? '#10B981' : '#EF4444'}
                                                                strokeWidth="0.5"
                                                            />
                                                            {/* 5년 추세선 (빗각) */}
                                                            <line
                                                                x1={padding}
                                                                y1={trendStartY}
                                                                x2={width - padding}
                                                                y2={trendEndY}
                                                                stroke={trendIsPositive ? '#3B82F6' : '#F59E0B'}
                                                                strokeWidth="0.4"
                                                                strokeDasharray="2,1"
                                                            />
                                                        </svg>
                                                        <div className="absolute left-0 top-0 flex flex-col text-xs text-gray-500 dark:text-gray-400">
                                                            <span>${formatNumber(maxPrice)}</span>
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 flex flex-col text-xs text-gray-500 dark:text-gray-400">
                                                            <span>${formatNumber(minPrice)}</span>
                                                        </div>
                                                        <div className="absolute right-0 top-0 text-right">
                                                            <div>
                                                                <span className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {isPositive ? '+' : ''}{formatNumber(priceChange)}%
                                                                </span>
                                                                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                                                    (1년)
                                                                </span>
                                                            </div>
                                                            <div className="mt-1">
                                                                <span className={`text-sm font-semibold ${trendIsPositive ? 'text-blue-600' : 'text-amber-600'}`}>
                                                                    추세: {trendIsPositive ? '▲' : '▼'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        {/* Price Stats */}
                                        <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 dark:border-gray-700 md:grid-cols-4">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">최근 종가</p>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    ${formatNumber(prices[0]?.close)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">52주 최고</p>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    ${formatNumber(Math.max(...prices.slice(0, 12).map(p => p.close ?? 0)))}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">52주 최저</p>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    ${formatNumber(Math.min(...prices.slice(0, 12).filter(p => p.close).map(p => p.close as number)))}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">평균 거래량</p>
                                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {formatMarketCap(prices.reduce((sum, p) => sum + (p.volume ?? 0), 0) / prices.length)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Financial History Table */}
                            {financials.length > 0 && (
                                <div className="mb-8 rounded-lg bg-white shadow dark:bg-gray-800">
                                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">연간 실적</h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">연도</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">매출</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">영업이익</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">순이익</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">EPS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {financials.map((fin) => (
                                                    <tr key={fin.fiscal_date}>
                                                        <td className="whitespace-nowrap px-6 py-4 text-gray-900 dark:text-white">
                                                            {fin.fiscal_date.split('T')[0]}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            {formatMarketCap(fin.total_revenue)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            {formatMarketCap(fin.operating_income)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            {formatMarketCap(fin.net_income)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            ${formatNumber(fin.basic_eps)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Cashflow History */}
                            {cashflows.length > 0 && (
                                <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">현금흐름</h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">연도</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">영업현금흐름</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">CAPEX</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">잉여현금흐름</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {cashflows.map((cf) => (
                                                    <tr key={cf.fiscal_date}>
                                                        <td className="whitespace-nowrap px-6 py-4 text-gray-900 dark:text-white">
                                                            {cf.fiscal_date.split('T')[0]}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            {formatMarketCap(cf.operating_cashflow)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-red-600 dark:text-red-400">
                                                            {formatMarketCap(cf.capex)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-green-600 dark:text-green-400">
                                                            {formatMarketCap(cf.free_cashflow)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Analyst Rating */}
                            {analystRating && (
                                <div className="mt-8 rounded-lg bg-white shadow dark:bg-gray-800">
                                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">애널리스트 평가</h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {/* Consensus & Target Price */}
                                            <div>
                                                <div className="mb-4 text-center">
                                                    <span className={`inline-block rounded-full px-4 py-2 text-lg font-bold ${
                                                        analystRating.consensus === '강력매수' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                        analystRating.consensus === '매수' ? 'bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                                                        analystRating.consensus === '매도' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                    }`}>
                                                        {analystRating.consensus}
                                                    </span>
                                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                                        {analystRating.total_recommendations}명의 애널리스트
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-center">
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">목표가 (평균)</p>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                            ${formatNumber(analystRating.target_mean)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">목표가 (중간값)</p>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                            ${formatNumber(analystRating.target_median)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">최고 목표가</p>
                                                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                                                            ${formatNumber(analystRating.target_high)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">최저 목표가</p>
                                                        <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                                                            ${formatNumber(analystRating.target_low)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Recommendation Distribution */}
                                            <div>
                                                <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">추천 분포</h4>
                                                <div className="space-y-2">
                                                    {[
                                                        { label: '강력 매수', value: analystRating.strong_buy, color: 'bg-green-600' },
                                                        { label: '매수', value: analystRating.buy, color: 'bg-green-400' },
                                                        { label: '보유', value: analystRating.hold, color: 'bg-yellow-400' },
                                                        { label: '매도', value: analystRating.sell, color: 'bg-red-400' },
                                                        { label: '강력 매도', value: analystRating.strong_sell, color: 'bg-red-600' },
                                                    ].map(item => (
                                                        <div key={item.label} className="flex items-center gap-3">
                                                            <span className="w-16 text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
                                                            <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${item.color}`}
                                                                    style={{ width: `${analystRating.total_recommendations ? (item.value / analystRating.total_recommendations) * 100 : 0}%` }}
                                                                />
                                                            </div>
                                                            <span className="w-6 text-right text-xs font-medium text-gray-900 dark:text-white">{item.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {analystRating.next_earnings_date && (
                                                    <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                                            <span className="font-medium">다음 실적 발표:</span> {analystRating.next_earnings_date.split('T')[0]}
                                                            {analystRating.next_eps_estimate && (
                                                                <span className="ml-2">(예상 EPS: ${formatNumber(analystRating.next_eps_estimate, 4)})</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Earnings Estimates */}
                            {earningsEstimates.length > 0 && (
                                <div className="mt-8 rounded-lg bg-white shadow dark:bg-gray-800">
                                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">실적 예측</h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {/* EPS Estimates */}
                                            <div>
                                                <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">EPS 예측</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">기간</th>
                                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">예상</th>
                                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">전년</th>
                                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">성장률</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                            {earningsEstimates.filter(e => e.estimate_type === 'eps').map((est) => (
                                                                <tr key={est.period}>
                                                                    <td className="px-3 py-2 text-gray-900 dark:text-white">{est.period}</td>
                                                                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">
                                                                        ${formatNumber(est.estimate_avg, 2)}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">
                                                                        {est.year_ago_value ? `$${formatNumber(est.year_ago_value, 2)}` : '-'}
                                                                    </td>
                                                                    <td className={`px-3 py-2 text-right ${
                                                                        est.growth && est.growth > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                                    }`}>
                                                                        {est.growth ? `${est.growth > 0 ? '+' : ''}${formatNumber(est.growth * 100, 1)}%` : '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                            {/* Revenue Estimates */}
                                            <div>
                                                <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">매출 예측</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">기간</th>
                                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">예상</th>
                                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">전년</th>
                                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300">성장률</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                            {earningsEstimates.filter(e => e.estimate_type === 'revenue').map((est) => (
                                                                <tr key={est.period}>
                                                                    <td className="px-3 py-2 text-gray-900 dark:text-white">{est.period}</td>
                                                                    <td className="px-3 py-2 text-right text-gray-900 dark:text-white">
                                                                        {formatMarketCap(est.estimate_avg)}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">
                                                                        {formatMarketCap(est.year_ago_value)}
                                                                    </td>
                                                                    <td className={`px-3 py-2 text-right ${
                                                                        est.growth && est.growth > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                                                    }`}>
                                                                        {est.growth ? `${est.growth > 0 ? '+' : ''}${formatNumber(est.growth * 100, 1)}%` : '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Earnings History */}
                            {earningsHistories.length > 0 && (
                                <div className="mt-8 rounded-lg bg-white shadow dark:bg-gray-800">
                                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">실적 발표 히스토리</h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">발표일</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">예상 EPS</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">실제 EPS</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">서프라이즈</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {earningsHistories.map((history, idx) => (
                                                    <tr key={idx}>
                                                        <td className="whitespace-nowrap px-6 py-4 text-gray-900 dark:text-white">
                                                            {history.earnings_date.split('T')[0]}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-500 dark:text-gray-400">
                                                            {history.eps_estimate ? `$${formatNumber(history.eps_estimate, 2)}` : '-'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                                                            {history.reported_eps ? `$${formatNumber(history.reported_eps, 2)}` : '-'}
                                                        </td>
                                                        <td className={`whitespace-nowrap px-6 py-4 text-right font-medium ${
                                                            history.surprise_percent && history.surprise_percent > 0
                                                                ? 'text-green-600 dark:text-green-400'
                                                                : history.surprise_percent && history.surprise_percent < 0
                                                                    ? 'text-red-600 dark:text-red-400'
                                                                    : 'text-gray-600 dark:text-gray-400'
                                                        }`}>
                                                            {history.surprise_percent !== null ? (
                                                                <>
                                                                    {history.surprise_percent > 0 ? '+' : ''}{formatNumber(history.surprise_percent, 2)}%
                                                                    {history.surprise_percent > 0 && ' (Beat)'}
                                                                    {history.surprise_percent < 0 && ' (Miss)'}
                                                                </>
                                                            ) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Options Summary */}
                            {options.length > 0 && (
                                <div className="mt-8 rounded-lg bg-white shadow dark:bg-gray-800">
                                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">옵션 현황</h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">만기일</th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-300">유형</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">계약 수</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">총 거래량</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">미결제약정</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {options.map((opt, idx) => (
                                                    <tr key={idx}>
                                                        <td className="whitespace-nowrap px-6 py-4 text-gray-900 dark:text-white">
                                                            {opt.expiration_date.split('T')[0]}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-center">
                                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                                                opt.option_type === 'call'
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                            }`}>
                                                                {opt.option_type === 'call' ? '콜' : '풋'}
                                                            </span>
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            {opt.count.toLocaleString()}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            {opt.total_volume?.toLocaleString() ?? '-'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            {opt.total_open_interest?.toLocaleString() ?? '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Institutional Holders */}
                            {institutionalHolders.length > 0 && (
                                <div className="mt-8 rounded-lg bg-white shadow dark:bg-gray-800">
                                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">기관투자자 보유현황</h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">기관명</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">보유주식</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">보유비율</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">보유가치</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">보고일</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {institutionalHolders.map((holder, idx) => (
                                                    <tr key={idx}>
                                                        <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                            {holder.holder_name}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            {holder.shares?.toLocaleString() ?? '-'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            {holder.percent_out ? `${(holder.percent_out * 100).toFixed(2)}%` : '-'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            {formatMarketCap(holder.value)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-500 dark:text-gray-400">
                                                            {holder.date_reported?.split('T')[0] ?? '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Insider Transactions */}
                            {insiderTransactions.length > 0 && (
                                <div className="mt-8 rounded-lg bg-white shadow dark:bg-gray-800">
                                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">내부자 거래</h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">내부자</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-300">직위</th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500 dark:text-gray-300">거래유형</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">주식 수</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">거래금액</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-300">거래일</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {insiderTransactions.map((tx, idx) => (
                                                    <tr key={idx}>
                                                        <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                            {tx.insider_name}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
                                                            {tx.position ?? '-'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-center">
                                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                                                tx.shares && tx.shares > 0
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                            }`}>
                                                                {tx.shares && tx.shares > 0 ? '매수' : '매도'}
                                                            </span>
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            {tx.shares ? Math.abs(tx.shares).toLocaleString() : '-'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                            {tx.value ? `$${tx.value.toLocaleString()}` : '-'}
                                                        </td>
                                                        <td className="whitespace-nowrap px-6 py-4 text-right text-gray-500 dark:text-gray-400">
                                                            {tx.transaction_date?.split('T')[0] ?? '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
