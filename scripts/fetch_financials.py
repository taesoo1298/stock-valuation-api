#!/usr/bin/env python3
"""
Yahoo Finance 재무제표 데이터 수집 스크립트
Laravel에서 호출하여 JSON 형태로 데이터 반환
"""

import sys
import json
import yfinance as yf
from datetime import datetime


def safe_value(val):
    """NaN, Inf 등을 None으로 변환"""
    if val is None:
        return None
    try:
        import math
        if math.isnan(val) or math.isinf(val):
            return None
        return float(val)
    except (TypeError, ValueError):
        return None


def fetch_stock_data(ticker_symbol: str) -> dict:
    """주식 데이터 전체 수집"""
    try:
        ticker = yf.Ticker(ticker_symbol)

        result = {
            "success": True,
            "ticker": ticker_symbol,
            "timestamp": datetime.now().isoformat(),
            "info": {},
            "income_stmt": {},
            "balance_sheet": {},
            "cashflow": {},
            "history": []
        }

        # 기본 정보
        info = ticker.info
        result["info"] = {
            "name": info.get("longName") or info.get("shortName"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "exchange": info.get("exchange"),
            "currency": info.get("currency"),
            "current_price": safe_value(info.get("currentPrice") or info.get("regularMarketPrice")),
            "market_cap": safe_value(info.get("marketCap")),
            "enterprise_value": safe_value(info.get("enterpriseValue")),
            # 밸류에이션
            "pe_ratio": safe_value(info.get("trailingPE")),
            "forward_pe": safe_value(info.get("forwardPE")),
            "peg_ratio": safe_value(info.get("pegRatio")),
            "pb_ratio": safe_value(info.get("priceToBook")),
            "ps_ratio": safe_value(info.get("priceToSalesTrailing12Months")),
            "ev_ebitda": safe_value(info.get("enterpriseToEbitda")),
            "ev_revenue": safe_value(info.get("enterpriseToRevenue")),
            # 수익성
            "profit_margin": safe_value(info.get("profitMargins")),
            "operating_margin": safe_value(info.get("operatingMargins")),
            "gross_margin": safe_value(info.get("grossMargins")),
            "roe": safe_value(info.get("returnOnEquity")),
            "roa": safe_value(info.get("returnOnAssets")),
            # 주당 지표
            "eps": safe_value(info.get("trailingEps")),
            "forward_eps": safe_value(info.get("forwardEps")),
            "book_value": safe_value(info.get("bookValue")),
            "revenue_per_share": safe_value(info.get("revenuePerShare")),
            # 배당
            "dividend_rate": safe_value(info.get("dividendRate")),
            "dividend_yield": safe_value(info.get("dividendYield")),
            "payout_ratio": safe_value(info.get("payoutRatio")),
            # 성장률
            "earnings_growth": safe_value(info.get("earningsGrowth")),
            "revenue_growth": safe_value(info.get("revenueGrowth")),
            # 재무 건전성
            "total_cash": safe_value(info.get("totalCash")),
            "total_debt": safe_value(info.get("totalDebt")),
            "debt_to_equity": safe_value(info.get("debtToEquity")),
            "current_ratio": safe_value(info.get("currentRatio")),
            "quick_ratio": safe_value(info.get("quickRatio")),
            # 현금흐름
            "operating_cashflow": safe_value(info.get("operatingCashflow")),
            "free_cashflow": safe_value(info.get("freeCashflow")),
            # 주식 정보
            "shares_outstanding": safe_value(info.get("sharesOutstanding")),
            "float_shares": safe_value(info.get("floatShares")),
            "beta": safe_value(info.get("beta")),
            "52_week_high": safe_value(info.get("fiftyTwoWeekHigh")),
            "52_week_low": safe_value(info.get("fiftyTwoWeekLow")),
            "50_day_avg": safe_value(info.get("fiftyDayAverage")),
            "200_day_avg": safe_value(info.get("twoHundredDayAverage")),
        }

        # 손익계산서 (연간)
        try:
            income_stmt = ticker.income_stmt
            if income_stmt is not None and not income_stmt.empty:
                for col in income_stmt.columns:
                    date_str = col.strftime("%Y-%m-%d") if hasattr(col, 'strftime') else str(col)
                    result["income_stmt"][date_str] = {
                        "total_revenue": safe_value(income_stmt.loc["Total Revenue", col] if "Total Revenue" in income_stmt.index else None),
                        "gross_profit": safe_value(income_stmt.loc["Gross Profit", col] if "Gross Profit" in income_stmt.index else None),
                        "operating_income": safe_value(income_stmt.loc["Operating Income", col] if "Operating Income" in income_stmt.index else None),
                        "net_income": safe_value(income_stmt.loc["Net Income", col] if "Net Income" in income_stmt.index else None),
                        "ebitda": safe_value(income_stmt.loc["EBITDA", col] if "EBITDA" in income_stmt.index else None),
                        "basic_eps": safe_value(income_stmt.loc["Basic EPS", col] if "Basic EPS" in income_stmt.index else None),
                        "diluted_eps": safe_value(income_stmt.loc["Diluted EPS", col] if "Diluted EPS" in income_stmt.index else None),
                    }
        except Exception as e:
            result["income_stmt"] = {"error": str(e)}

        # 재무상태표 (연간)
        try:
            balance = ticker.balance_sheet
            if balance is not None and not balance.empty:
                for col in balance.columns:
                    date_str = col.strftime("%Y-%m-%d") if hasattr(col, 'strftime') else str(col)
                    result["balance_sheet"][date_str] = {
                        "total_assets": safe_value(balance.loc["Total Assets", col] if "Total Assets" in balance.index else None),
                        "total_liabilities": safe_value(balance.loc["Total Liabilities Net Minority Interest", col] if "Total Liabilities Net Minority Interest" in balance.index else None),
                        "stockholders_equity": safe_value(balance.loc["Stockholders Equity", col] if "Stockholders Equity" in balance.index else None),
                        "total_debt": safe_value(balance.loc["Total Debt", col] if "Total Debt" in balance.index else None),
                        "cash_and_equivalents": safe_value(balance.loc["Cash And Cash Equivalents", col] if "Cash And Cash Equivalents" in balance.index else None),
                        "current_assets": safe_value(balance.loc["Current Assets", col] if "Current Assets" in balance.index else None),
                        "current_liabilities": safe_value(balance.loc["Current Liabilities", col] if "Current Liabilities" in balance.index else None),
                    }
        except Exception as e:
            result["balance_sheet"] = {"error": str(e)}

        # 현금흐름표 (연간)
        try:
            cashflow = ticker.cashflow
            if cashflow is not None and not cashflow.empty:
                for col in cashflow.columns:
                    date_str = col.strftime("%Y-%m-%d") if hasattr(col, 'strftime') else str(col)
                    result["cashflow"][date_str] = {
                        "operating_cashflow": safe_value(cashflow.loc["Operating Cash Flow", col] if "Operating Cash Flow" in cashflow.index else None),
                        "investing_cashflow": safe_value(cashflow.loc["Investing Cash Flow", col] if "Investing Cash Flow" in cashflow.index else None),
                        "financing_cashflow": safe_value(cashflow.loc["Financing Cash Flow", col] if "Financing Cash Flow" in cashflow.index else None),
                        "free_cashflow": safe_value(cashflow.loc["Free Cash Flow", col] if "Free Cash Flow" in cashflow.index else None),
                        "capex": safe_value(cashflow.loc["Capital Expenditure", col] if "Capital Expenditure" in cashflow.index else None),
                    }
        except Exception as e:
            result["cashflow"] = {"error": str(e)}

        # 가격 히스토리 (최근 5년, 월봉)
        try:
            history = ticker.history(period="5y", interval="1mo")
            if history is not None and not history.empty:
                for idx, row in history.iterrows():
                    date_str = idx.strftime("%Y-%m-%d") if hasattr(idx, 'strftime') else str(idx)
                    result["history"].append({
                        "date": date_str,
                        "open": safe_value(row.get("Open")),
                        "high": safe_value(row.get("High")),
                        "low": safe_value(row.get("Low")),
                        "close": safe_value(row.get("Close")),
                        "volume": safe_value(row.get("Volume")),
                    })
        except Exception as e:
            result["history"] = []

        return result

    except Exception as e:
        return {
            "success": False,
            "ticker": ticker_symbol,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Ticker symbol required"}))
        sys.exit(1)

    ticker_symbol = sys.argv[1].upper()
    result = fetch_stock_data(ticker_symbol)
    print(json.dumps(result, ensure_ascii=False))
