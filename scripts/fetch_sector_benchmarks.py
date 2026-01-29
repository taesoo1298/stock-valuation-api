#!/usr/bin/env python3
"""
Fetch sector benchmark data from ETFs using yfinance.
"""

import json
import sys
import yfinance as yf

SECTOR_ETFS = [
    ('SMH', 'Semiconductors', '반도체'),
    ('XLK', 'Technology', '기술'),
    ('XLE', 'Energy', '에너지'),
    ('XLI', 'Industrials', '산업재'),
    ('XLF', 'Financials', '금융'),
    ('XLV', 'Healthcare', '헬스케어'),
    ('XLY', 'Consumer Discretionary', '경기소비재'),
    ('XLP', 'Consumer Staples', '필수소비재'),
    ('XLU', 'Utilities', '유틸리티'),
    ('XLRE', 'Real Estate', '부동산'),
    ('XLC', 'Communication Services', '커뮤니케이션'),
    ('XLB', 'Materials', '소재'),
    ('SOXX', 'Semiconductors (SOXX)', '반도체(SOXX)'),
    ('IGV', 'Software', '소프트웨어'),
    ('IBB', 'Biotech', '바이오'),
    ('IYT', 'Transportation', '운송'),
    ('ROBO', 'Robotics & AI', '로봇/AI'),
]


def fetch_benchmark(ticker: str, sector_name: str, sector_name_kr: str) -> dict:
    """Fetch benchmark data for a single ETF."""
    try:
        etf = yf.Ticker(ticker)
        info = etf.info

        return {
            'etf_ticker': ticker,
            'sector_name': sector_name,
            'sector_name_kr': sector_name_kr,
            'trailing_pe': info.get('trailingPE'),
            'forward_pe': info.get('forwardPE'),
            'pb_ratio': info.get('priceToBook'),
            'dividend_yield': info.get('dividendYield'),
            'market_cap': info.get('totalAssets') or info.get('marketCap'),
        }
    except Exception as e:
        return {
            'etf_ticker': ticker,
            'sector_name': sector_name,
            'sector_name_kr': sector_name_kr,
            'error': str(e),
        }


def main():
    results = []

    for ticker, sector_name, sector_name_kr in SECTOR_ETFS:
        benchmark = fetch_benchmark(ticker, sector_name, sector_name_kr)
        results.append(benchmark)

    output = {
        'success': True,
        'benchmarks': results,
    }

    print(json.dumps(output))


if __name__ == '__main__':
    main()
