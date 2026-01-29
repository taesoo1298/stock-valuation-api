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

interface Analysis {
    investment_rating: string | null;
    analysis_summary: string | null;
    latest_quarter_label: string | null;
    quarterly_revenue: number | null;
    quarterly_eps: number | null;
    quarterly_gross_margin: number | null;
    quarterly_operating_margin: number | null;
    revenue_beat_percent: number | null;
    eps_beat_percent: number | null;
    guidance_revenue: number | null;
    guidance_eps: number | null;
    guidance_revenue_vs_estimate: number | null;
    guidance_eps_vs_estimate: number | null;
    revenue_cagr_5y: number | null;
    revenue_cagr_2y: number | null;
    eps_cagr_5y: number | null;
    wall_street_revenue_estimate: number | null;
    wall_street_eps_estimate: number | null;
    gross_margin: number | null;
    operating_margin: number | null;
    gross_margin_trend: string | null;
    operating_margin_trend: string | null;
    roic: number | null;
    cash: number | null;
    debt: number | null;
    net_debt_to_ebitda: number | null;
    quality_score: number | null;
    value_score: number | null;
    key_highlights: string[] | null;
    chart_urls: string[] | null;
    updated_at: string | null;
}

interface Props {
    stock: Stock;
    analysis: Analysis | null;
}

function formatLargeNumber(value: number | null): string {
    if (value === null || value === undefined) return '-';
    const num = Number(value);
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
    return `${sign}$${abs.toFixed(2)}`;
}

function formatNumber(value: number | null, decimals = 2): string {
    if (value === null || value === undefined) return '-';
    return Number(value).toFixed(decimals);
}

function formatPercent(value: number | null): string {
    if (value === null || value === undefined) return '-';
    return `${Number(value).toFixed(1)}%`;
}

function getBadgeStyle(label: string): { color: string; bg: string } {
    const lower = label.toLowerCase();
    if (lower.includes('high quality') || lower.includes('outperform')) {
        return { color: 'text-green-800 dark:text-green-200', bg: 'bg-green-100 dark:bg-green-900/60' };
    }
    if (lower.includes('timely buy')) {
        return { color: 'text-emerald-800 dark:text-emerald-200', bg: 'bg-emerald-100 dark:bg-emerald-900/60' };
    }
    if (lower.includes('average') || lower.includes('fair value') || lower.includes('market perform')) {
        return { color: 'text-yellow-800 dark:text-yellow-200', bg: 'bg-yellow-100 dark:bg-yellow-900/60' };
    }
    if (lower.includes('low quality') || lower.includes('underperform') || lower.includes('overvalued')) {
        return { color: 'text-red-800 dark:text-red-200', bg: 'bg-red-100 dark:bg-red-900/60' };
    }
    return { color: 'text-blue-800 dark:text-blue-200', bg: 'bg-blue-100 dark:bg-blue-900/60' };
}

function getBeatColor(value: number | null): string {
    if (value === null || value === undefined) return 'text-gray-600 dark:text-gray-400';
    return Number(value) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
}

function getTrendLabel(trend: string | null): string {
    if (!trend) return '-';
    const lower = trend.toLowerCase();
    if (lower.includes('up') || lower.includes('improv') || lower.includes('expand')) return 'Expanding';
    if (lower.includes('down') || lower.includes('declin') || lower.includes('contract')) return 'Contracting';
    if (lower.includes('stable') || lower.includes('flat')) return 'Stable';
    return trend;
}

function getTrendColor(trend: string | null): string {
    if (!trend) return 'text-gray-500 dark:text-gray-400';
    const lower = trend.toLowerCase();
    if (lower.includes('up') || lower.includes('improv') || lower.includes('expand')) return 'text-green-600 dark:text-green-400';
    if (lower.includes('down') || lower.includes('declin') || lower.includes('contract')) return 'text-red-600 dark:text-red-400';
    return 'text-yellow-600 dark:text-yellow-400';
}

function chartLabel(url: string): string {
    // "Meta-Quarterly-Revenue_2026-01-29-..." → "Quarterly Revenue"
    const match = url.match(/chart-images\/[^/]*?-(.+?)_\d{4}/);
    if (!match) return 'Chart';
    return match[1].replace(/-/g, ' ').replace(/Trailing 12 Month/i, 'TTM');
}

function GrowthValue({ value }: { value: number | null }) {
    if (value === null || value === undefined) return <span className="text-gray-400">-</span>;
    const num = Number(value);
    const color = num >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    return <span className={`text-2xl font-bold ${color}`}>{num >= 0 ? '+' : ''}{formatPercent(value)}</span>;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700 ${className}`}>{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{children}</h2>;
}

function MetricCard({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">{label}</p>
            {children}
        </div>
    );
}

export default function StockStory({ stock, analysis }: Props) {
    const ratingParts = analysis?.investment_rating?.split(/\s*\/\s*/) ?? [];
    const showCagr2y = analysis?.revenue_cagr_2y !== null
        && analysis?.revenue_cagr_5y !== null
        && Number(analysis.revenue_cagr_2y) !== Number(analysis.revenue_cagr_5y);

    return (
        <>
            <Head title={`${stock.ticker} - StockStory 분석`} />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Link href="/stocks" className="hover:text-gray-900 dark:hover:text-white">종목 목록</Link>
                        <span>/</span>
                        <Link href={`/stocks/${stock.ticker}`} className="hover:text-gray-900 dark:hover:text-white">{stock.ticker}</Link>
                        <span>/</span>
                        <span className="text-gray-900 dark:text-white">StockStory</span>
                    </nav>

                    {/* Header */}
                    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{stock.name}</h1>
                                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-sm font-mono text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                    {stock.ticker}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {stock.exchange} · {stock.sector?.name}
                                {analysis?.updated_at && (
                                    <> · Synced {new Date(analysis.updated_at).toLocaleDateString('ko-KR')}</>
                                )}
                            </p>
                        </div>
                        <a
                            href={`https://stockstory.org/us/stocks/${stock.exchange.toLowerCase()}/${stock.ticker.toLowerCase()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            StockStory.org
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>

                    {!analysis ? (
                        <Card>
                            <div className="py-8 text-center">
                                <p className="text-gray-500 dark:text-gray-400">
                                    StockStory 데이터가 없습니다. 먼저 동기화를 실행해 주세요.
                                </p>
                                <code className="mt-3 inline-block rounded bg-gray-100 px-3 py-1.5 text-sm dark:bg-gray-700">
                                    php artisan stocks:sync-stockstory --ticker={stock.ticker}
                                </code>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {/* Rating + Summary */}
                            {(ratingParts.length > 0 || analysis.analysis_summary) && (
                                <Card>
                                    {ratingParts.length > 0 && (
                                        <div className="mb-4 flex flex-wrap gap-2">
                                            {ratingParts.map((part) => {
                                                const style = getBadgeStyle(part);
                                                return (
                                                    <span key={part} className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${style.bg} ${style.color}`}>
                                                        {part}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {analysis.analysis_summary && (
                                        <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                                            {analysis.analysis_summary}
                                        </p>
                                    )}
                                </Card>
                            )}

                            {/* Quarterly Results */}
                            {(analysis.quarterly_revenue !== null || analysis.quarterly_eps !== null) && (
                                <Card>
                                    <SectionTitle>
                                        최근 분기 실적
                                        {analysis.latest_quarter_label && (
                                            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                                {analysis.latest_quarter_label}
                                            </span>
                                        )}
                                    </SectionTitle>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {analysis.quarterly_revenue !== null && (
                                            <MetricCard label="매출 (Revenue)">
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {formatLargeNumber(analysis.quarterly_revenue)}
                                                </p>
                                                {analysis.revenue_beat_percent !== null && (
                                                    <p className={`mt-1 text-sm font-medium ${getBeatColor(analysis.revenue_beat_percent)}`}>
                                                        {Number(analysis.revenue_beat_percent) >= 0 ? '+' : ''}
                                                        {formatPercent(analysis.revenue_beat_percent)} vs Est.
                                                        {Number(analysis.revenue_beat_percent) >= 0 ? ' Beat' : ' Miss'}
                                                    </p>
                                                )}
                                            </MetricCard>
                                        )}
                                        {analysis.quarterly_eps !== null && (
                                            <MetricCard label="EPS (GAAP)">
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    ${formatNumber(analysis.quarterly_eps, 2)}
                                                </p>
                                                {analysis.eps_beat_percent !== null && (
                                                    <p className={`mt-1 text-sm font-medium ${getBeatColor(analysis.eps_beat_percent)}`}>
                                                        {Number(analysis.eps_beat_percent) >= 0 ? '+' : ''}
                                                        {formatPercent(analysis.eps_beat_percent)} vs Est.
                                                        {Number(analysis.eps_beat_percent) >= 0 ? ' Beat' : ' Miss'}
                                                    </p>
                                                )}
                                            </MetricCard>
                                        )}
                                        {(analysis.quarterly_gross_margin !== null || analysis.quarterly_operating_margin !== null) && (
                                            <MetricCard label="마진">
                                                <div className="space-y-2">
                                                    {analysis.quarterly_gross_margin !== null && (
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">Gross</span>
                                                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                                                {formatPercent(analysis.quarterly_gross_margin)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {analysis.quarterly_operating_margin !== null && (
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">Operating</span>
                                                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                                                {formatPercent(analysis.quarterly_operating_margin)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </MetricCard>
                                        )}
                                    </div>
                                </Card>
                            )}

                            {/* Guidance */}
                            {(analysis.guidance_revenue !== null || analysis.guidance_eps !== null) && (
                                <Card>
                                    <SectionTitle>가이던스 (다음 분기)</SectionTitle>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {analysis.guidance_revenue !== null && (
                                            <MetricCard label="매출 가이던스 (Midpoint)">
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    {formatLargeNumber(analysis.guidance_revenue)}
                                                </p>
                                                {analysis.guidance_revenue_vs_estimate !== null && (
                                                    <p className={`mt-1 text-sm font-medium ${getBeatColor(analysis.guidance_revenue_vs_estimate)}`}>
                                                        {Number(analysis.guidance_revenue_vs_estimate) >= 0 ? '+' : ''}
                                                        {formatPercent(analysis.guidance_revenue_vs_estimate)} vs Consensus
                                                    </p>
                                                )}
                                            </MetricCard>
                                        )}
                                        {analysis.guidance_eps !== null && (
                                            <MetricCard label="EPS 가이던스">
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                                    ${formatNumber(analysis.guidance_eps, 2)}
                                                </p>
                                                {analysis.guidance_eps_vs_estimate !== null && (
                                                    <p className={`mt-1 text-sm font-medium ${getBeatColor(analysis.guidance_eps_vs_estimate)}`}>
                                                        {Number(analysis.guidance_eps_vs_estimate) >= 0 ? '+' : ''}
                                                        {formatPercent(analysis.guidance_eps_vs_estimate)} vs Consensus
                                                    </p>
                                                )}
                                            </MetricCard>
                                        )}
                                    </div>
                                </Card>
                            )}

                            {/* Growth + Profitability side by side */}
                            <div className="grid gap-6 lg:grid-cols-2">
                                {/* Growth */}
                                {(analysis.revenue_cagr_5y !== null || analysis.eps_cagr_5y !== null) && (
                                    <Card>
                                        <SectionTitle>성장 지표</SectionTitle>
                                        <div className="space-y-4">
                                            {analysis.revenue_cagr_5y !== null && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">매출 CAGR (Annualized)</span>
                                                    <GrowthValue value={analysis.revenue_cagr_5y} />
                                                </div>
                                            )}
                                            {showCagr2y && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">매출 CAGR (2Y)</span>
                                                    <GrowthValue value={analysis.revenue_cagr_2y} />
                                                </div>
                                            )}
                                            {analysis.eps_cagr_5y !== null && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">EPS CAGR</span>
                                                    <GrowthValue value={analysis.eps_cagr_5y} />
                                                </div>
                                            )}
                                            {(analysis.wall_street_revenue_estimate !== null || analysis.wall_street_eps_estimate !== null) && (
                                                <>
                                                    <hr className="border-gray-200 dark:border-gray-700" />
                                                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Wall Street 예상치</p>
                                                    {analysis.wall_street_revenue_estimate !== null && (
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">매출</span>
                                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                                {formatLargeNumber(analysis.wall_street_revenue_estimate)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {analysis.wall_street_eps_estimate !== null && (
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">EPS</span>
                                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                                ${formatNumber(analysis.wall_street_eps_estimate, 2)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </Card>
                                )}

                                {/* Profitability */}
                                {(analysis.gross_margin !== null || analysis.operating_margin !== null || analysis.roic !== null) && (
                                    <Card>
                                        <SectionTitle>수익성</SectionTitle>
                                        <div className="space-y-4">
                                            {analysis.gross_margin !== null && (
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">Gross Margin</span>
                                                        {analysis.gross_margin_trend && (
                                                            <span className={`ml-2 text-xs ${getTrendColor(analysis.gross_margin_trend)}`}>
                                                                ({getTrendLabel(analysis.gross_margin_trend)})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatPercent(analysis.gross_margin)}</span>
                                                </div>
                                            )}
                                            {analysis.operating_margin !== null && (
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">Operating Margin</span>
                                                        {analysis.operating_margin_trend && (
                                                            <span className={`ml-2 text-xs ${getTrendColor(analysis.operating_margin_trend)}`}>
                                                                ({getTrendLabel(analysis.operating_margin_trend)})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatPercent(analysis.operating_margin)}</span>
                                                </div>
                                            )}
                                            {analysis.roic !== null && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">ROIC</span>
                                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{formatPercent(analysis.roic)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                )}
                            </div>

                            {/* Financial Health */}
                            {(analysis.cash !== null || analysis.debt !== null) && (
                                <Card>
                                    <SectionTitle>재무 건전성</SectionTitle>
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        {analysis.cash !== null && (
                                            <MetricCard label="현금 (Cash)">
                                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                    {formatLargeNumber(analysis.cash)}
                                                </p>
                                            </MetricCard>
                                        )}
                                        {analysis.debt !== null && (
                                            <MetricCard label="부채 (Debt)">
                                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                                    {formatLargeNumber(analysis.debt)}
                                                </p>
                                            </MetricCard>
                                        )}
                                        {analysis.cash !== null && analysis.debt !== null && (
                                            <MetricCard label="순현금 (Net Cash)">
                                                <p className={`text-2xl font-bold ${Number(analysis.cash) - Number(analysis.debt) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {formatLargeNumber(Number(analysis.cash) - Number(analysis.debt))}
                                                </p>
                                            </MetricCard>
                                        )}
                                    </div>
                                    {analysis.cash !== null && analysis.debt !== null && (
                                        <div className="mt-4">
                                            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                                <div className="flex h-full">
                                                    <div
                                                        className="rounded-l-full bg-green-500 transition-all"
                                                        style={{ width: `${(Number(analysis.cash) / (Number(analysis.cash) + Number(analysis.debt))) * 100}%` }}
                                                    />
                                                    <div
                                                        className="rounded-r-full bg-red-500 transition-all"
                                                        style={{ width: `${(Number(analysis.debt) / (Number(analysis.cash) + Number(analysis.debt))) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-1.5 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                                <span>Cash {formatLargeNumber(analysis.cash)}</span>
                                                {analysis.net_debt_to_ebitda !== null && (
                                                    <span>Net Debt/EBITDA: {formatNumber(analysis.net_debt_to_ebitda, 1)}x</span>
                                                )}
                                                <span>Debt {formatLargeNumber(analysis.debt)}</span>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            )}

                            {/* Scores */}
                            {(analysis.quality_score !== null || analysis.value_score !== null) && (
                                <Card>
                                    <SectionTitle>종합 점수</SectionTitle>
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        {analysis.quality_score !== null && (
                                            <div>
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Quality Score</span>
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumber(analysis.quality_score, 0)}</span>
                                                </div>
                                                <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <div
                                                        className={`h-2.5 rounded-full ${Number(analysis.quality_score) >= 70 ? 'bg-green-500' : Number(analysis.quality_score) >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                        style={{ width: `${Math.min(Number(analysis.quality_score), 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {analysis.value_score !== null && (
                                            <div>
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">Value Score</span>
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumber(analysis.value_score, 0)}</span>
                                                </div>
                                                <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <div
                                                        className={`h-2.5 rounded-full ${Number(analysis.value_score) >= 70 ? 'bg-green-500' : Number(analysis.value_score) >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                        style={{ width: `${Math.min(Number(analysis.value_score), 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            )}

                            {/* Key Highlights */}
                            {analysis.key_highlights && analysis.key_highlights.length > 0 && (
                                <Card>
                                    <SectionTitle>핵심 포인트</SectionTitle>
                                    <ul className="space-y-3">
                                        {analysis.key_highlights.map((highlight, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                                    {idx + 1}
                                                </span>
                                                <span className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{highlight}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            )}

                            {/* Charts */}
                            {analysis.chart_urls && analysis.chart_urls.length > 0 && (
                                <Card>
                                    <SectionTitle>차트</SectionTitle>
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {analysis.chart_urls.map((url, idx) => (
                                            <div key={idx} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div className="border-b border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-750">
                                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{chartLabel(url)}</p>
                                                </div>
                                                <img
                                                    src={url}
                                                    alt={`${stock.ticker} - ${chartLabel(url)}`}
                                                    className="w-full bg-white dark:bg-gray-800"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )}

                            {/* Empty state */}
                            {!analysis.investment_rating &&
                                !analysis.analysis_summary &&
                                analysis.quarterly_revenue === null &&
                                analysis.quarterly_eps === null &&
                                analysis.gross_margin === null &&
                                analysis.cash === null &&
                                (!analysis.key_highlights || analysis.key_highlights.length === 0) &&
                                (!analysis.chart_urls || analysis.chart_urls.length === 0) && (
                                <Card>
                                    <div className="py-8 text-center">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            동기화되었으나 추출된 상세 분석 데이터가 없습니다.
                                        </p>
                                        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                                            해당 종목의 StockStory 페이지 구조가 다를 수 있습니다.
                                        </p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
