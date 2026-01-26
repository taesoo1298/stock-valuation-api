import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';

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
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSectorModal, setShowSectorModal] = useState(false);
    
    const stockForm = useForm({
        ticker: '',
        name: '',
        exchange: 'NASDAQ' as 'NASDAQ' | 'NYSE' | 'AMEX',
        sector_id: '',
    });

    const sectorForm = useForm({
        name: '',
        code: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        stockForm.post('/stocks', {
            onSuccess: () => {
                setShowAddModal(false);
                stockForm.reset();
            },
        });
    };

    const handleSectorSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sectorForm.post('/sectors', {
            onSuccess: () => {
                setShowSectorModal(false);
                sectorForm.reset();
            },
        });
    };

    const handleDelete = (ticker: string) => {
        if (confirm(`${ticker} 종목을 삭제하시겠습니까?`)) {
            router.delete(`/stocks/${ticker}`);
        }
    };

    const handleSectorDelete = (sectorId: number, sectorName: string) => {
        if (confirm(`${sectorName} 섹터를 삭제하시겠습니까?`)) {
            router.delete(`/sectors/${sectorId}`);
        }
    };

    return (
        <>
            <Head title="Stock Dashboard" />
            
            {/* Add Stock Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                종목 추가
                            </h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    티커 심볼
                                </label>
                                <input
                                    type="text"
                                    value={stockForm.data.ticker}
                                    onChange={(e) => stockForm.setData('ticker', e.target.value.toUpperCase())}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="AAPL"
                                    required
                                />
                                {stockForm.errors.ticker && (
                                    <p className="mt-1 text-sm text-red-600">{stockForm.errors.ticker}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    종목명
                                </label>
                                <input
                                    type="text"
                                    value={stockForm.data.name}
                                    onChange={(e) => stockForm.setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="Apple Inc."
                                    required
                                />
                                {stockForm.errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{stockForm.errors.name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    거래소
                                </label>
                                <select
                                    value={stockForm.data.exchange}
                                    onChange={(e) => stockForm.setData('exchange', e.target.value as 'NASDAQ' | 'NYSE' | 'AMEX')}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="NASDAQ">NASDAQ</option>
                                    <option value="NYSE">NYSE</option>
                                    <option value="AMEX">AMEX</option>
                                </select>
                                {stockForm.errors.exchange && (
                                    <p className="mt-1 text-sm text-red-600">{stockForm.errors.exchange}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    섹터
                                </label>
                                <select
                                    value={stockForm.data.sector_id}
                                    onChange={(e) => stockForm.setData('sector_id', e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    <option value="">섹터 선택</option>
                                    {sectors.map((sector) => (
                                        <option key={sector.id} value={sector.id}>
                                            {sector.name}
                                        </option>
                                    ))}
                                </select>
                                {stockForm.errors.sector_id && (
                                    <p className="mt-1 text-sm text-red-600">{stockForm.errors.sector_id}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={stockForm.processing}
                                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {stockForm.processing ? '저장 중...' : '저장'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Sector Modal */}
            {showSectorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                섹터 추가
                            </h3>
                            <button
                                onClick={() => setShowSectorModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSectorSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    섹터명
                                </label>
                                <input
                                    type="text"
                                    value={sectorForm.data.name}
                                    onChange={(e) => sectorForm.setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="반도체"
                                    required
                                />
                                {sectorForm.errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{sectorForm.errors.name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    코드
                                </label>
                                <input
                                    type="text"
                                    value={sectorForm.data.code}
                                    onChange={(e) => sectorForm.setData('code', e.target.value.toUpperCase())}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="SEMICONDUCTOR"
                                    required
                                />
                                {sectorForm.errors.code && (
                                    <p className="mt-1 text-sm text-red-600">{sectorForm.errors.code}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    설명 (선택)
                                </label>
                                <textarea
                                    value={sectorForm.data.description}
                                    onChange={(e) => sectorForm.setData('description', e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="섹터에 대한 설명"
                                    rows={2}
                                />
                                {sectorForm.errors.description && (
                                    <p className="mt-1 text-sm text-red-600">{sectorForm.errors.description}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowSectorModal(false)}
                                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={sectorForm.processing}
                                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {sectorForm.processing ? '저장 중...' : '저장'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                Stock Valuation Dashboard
                            </h1>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">
                                주식 밸류에이션 분석 및 적정가치 평가
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            종목 추가
                        </button>
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
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                섹터별 현황
                            </h2>
                            <button
                                onClick={() => setShowSectorModal(true)}
                                className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                섹터 추가
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                            {sectors.map((sector) => (
                                <div
                                    key={sector.id}
                                    className="group relative rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800"
                                >
                                    <button
                                        onClick={() => handleSectorDelete(sector.id, sector.name)}
                                        className="absolute right-2 top-2 hidden rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 group-hover:block dark:hover:bg-gray-700 dark:hover:text-red-400"
                                        title="삭제"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
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
                                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                                            관리
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
                                                <td className="whitespace-nowrap px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleDelete(stock.ticker)}
                                                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                        title="삭제"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
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
