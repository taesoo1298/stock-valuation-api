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

export default function StockShow({ stock, fundamental, financials, cashflows, prices, valuation }: Props) {
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
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
