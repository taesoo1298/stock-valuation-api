import { Head, Link } from '@inertiajs/react';

interface Sector {
    id: number;
    name: string;
    code: string;
    stocks_count: number;
}

interface Fundamental {
    id: number;
    date: string;
    current_price: number | null;
    pe_ratio: number | null;
    pb_ratio: number | null;
    ps_ratio: number | null;
    market_cap: number | null;
    roe: number | null;
    revenue_growth: number | null;
}

interface Stock {
    id: number;
    ticker: string;
    name: string;
    exchange: string;
    sector: Sector;
    fundamentals: Fundamental[];
}

interface Summary {
    total_stocks: number;
    total_sectors: number;
    average_pe: number;
    average_pb: number;
    total_market_cap: number;
    synced_stocks: number;
}

interface Props {
    sectors: Sector[];
    stocks: Stock[];
    summary: Summary;
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
    return `${(Number(value) * 100).toFixed(1)}%`;
}

export default function StocksIndex({ sectors, stocks, summary }: Props) {
    return (
        <>
            <Head title="Stock Dashboard" />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Stock Valuation Dashboard
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            주식 밸류에이션 분석 및 적정가치 평가
                        </p>
                    </div>

                    {/* Summary Cards */}
                    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-6">
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400">총 종목</p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                                {summary.total_stocks}
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400">동기화 완료</p>
                            <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
                                {summary.synced_stocks}
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400">섹터</p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                                {summary.total_sectors}
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400">평균 PER</p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                                {summary.average_pe || '-'}
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400">평균 PBR</p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                                {summary.average_pb || '-'}
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            <p className="text-sm text-gray-500 dark:text-gray-400">총 시가총액</p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                                {formatMarketCap(summary.total_market_cap)}
                            </p>
                        </div>
                    </div>

                    {/* Sectors */}
                    <div className="mb-8">
                        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                            섹터별 현황
                        </h2>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                            {sectors.map((sector) => (
                                <div
                                    key={sector.id}
                                    className="rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800"
                                >
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {sector.name}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        {sector.stocks_count}개 종목
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stock Table */}
                    <div className="rounded-lg bg-white shadow dark:bg-gray-800">
                        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                종목 리스트
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                종목을 클릭하면 상세 밸류에이션 분석을 볼 수 있습니다
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            티커
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            종목명
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            섹터
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            현재가
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            PER
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            PBR
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            ROE
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            시가총액
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            상태
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {stocks.map((stock) => {
                                        const fundamental = stock.fundamentals?.[0];
                                        const hasFundamental = !!fundamental;
                                        return (
                                            <tr
                                                key={stock.id}
                                                className="transition hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <Link
                                                        href={`/stocks/${stock.ticker}`}
                                                        className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        {stock.ticker}
                                                    </Link>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-gray-900 dark:text-white">
                                                    {stock.name}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
                                                    {stock.sector?.name}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                    {fundamental?.current_price
                                                        ? `$${formatNumber(fundamental.current_price)}`
                                                        : '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                    {formatNumber(fundamental?.pe_ratio ?? null)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                    {formatNumber(fundamental?.pb_ratio ?? null)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                    {formatPercent(fundamental?.roe ?? null)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-gray-900 dark:text-white">
                                                    {formatMarketCap(fundamental?.market_cap ?? null)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    {hasFundamental ? (
                                                        <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                            동기화됨
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                            대기중
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
