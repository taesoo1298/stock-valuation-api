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


def fetch_earnings_data(ticker) -> dict:
    """실적/가이던스 데이터 수집"""
    earnings_result = {
        "earnings_dates": [],
        "earnings_estimate": [],
        "revenue_estimate": [],
        "eps_trend": [],
        "calendar": {},
        "analyst_price_targets": {},
        "recommendations": []
    }

    try:
        # 실적발표 일정 및 실제/예상 EPS
        try:
            ed = ticker.earnings_dates
            if ed is not None and not ed.empty:
                for idx, row in ed.head(12).iterrows():
                    date_str = idx.strftime("%Y-%m-%d %H:%M:%S") if hasattr(idx, 'strftime') else str(idx)
                    earnings_result["earnings_dates"].append({
                        "earnings_date": date_str,
                        "eps_estimate": safe_value(row.get("EPS Estimate")),
                        "reported_eps": safe_value(row.get("Reported EPS")),
                        "surprise_percent": safe_value(row.get("Surprise(%)")),
                    })
        except Exception:
            pass

        # EPS 예상치
        try:
            ee = ticker.earnings_estimate
            if ee is not None and not ee.empty:
                for idx, row in ee.iterrows():
                    earnings_result["earnings_estimate"].append({
                        "period": str(idx),
                        "avg": safe_value(row.get("avg")),
                        "low": safe_value(row.get("low")),
                        "high": safe_value(row.get("high")),
                        "year_ago_eps": safe_value(row.get("yearAgoEps")),
                        "number_of_analysts": int(row.get("numberOfAnalysts")) if row.get("numberOfAnalysts") else None,
                        "growth": safe_value(row.get("growth")),
                    })
        except Exception:
            pass

        # 매출 예상치
        try:
            re = ticker.revenue_estimate
            if re is not None and not re.empty:
                for idx, row in re.iterrows():
                    earnings_result["revenue_estimate"].append({
                        "period": str(idx),
                        "avg": safe_value(row.get("avg")),
                        "low": safe_value(row.get("low")),
                        "high": safe_value(row.get("high")),
                        "year_ago_revenue": safe_value(row.get("yearAgoRevenue")),
                        "number_of_analysts": int(row.get("numberOfAnalysts")) if row.get("numberOfAnalysts") else None,
                        "growth": safe_value(row.get("growth")),
                    })
        except Exception:
            pass

        # EPS 추정치 변화 추이
        try:
            et = ticker.eps_trend
            if et is not None and not et.empty:
                for idx, row in et.iterrows():
                    earnings_result["eps_trend"].append({
                        "period": str(idx),
                        "current": safe_value(row.get("current")),
                        "7days_ago": safe_value(row.get("7daysAgo")),
                        "30days_ago": safe_value(row.get("30daysAgo")),
                        "60days_ago": safe_value(row.get("60daysAgo")),
                        "90days_ago": safe_value(row.get("90daysAgo")),
                    })
        except Exception:
            pass

        # 다음 실적발표 일정
        try:
            cal = ticker.calendar
            if cal:
                earnings_result["calendar"] = {
                    "dividend_date": str(cal.get("Dividend Date")) if cal.get("Dividend Date") else None,
                    "ex_dividend_date": str(cal.get("Ex-Dividend Date")) if cal.get("Ex-Dividend Date") else None,
                    "earnings_date": str(cal.get("Earnings Date", [None])[0]) if cal.get("Earnings Date") else None,
                    "earnings_high": safe_value(cal.get("Earnings High")),
                    "earnings_low": safe_value(cal.get("Earnings Low")),
                    "earnings_avg": safe_value(cal.get("Earnings Average")),
                    "revenue_high": safe_value(cal.get("Revenue High")),
                    "revenue_low": safe_value(cal.get("Revenue Low")),
                    "revenue_avg": safe_value(cal.get("Revenue Average")),
                }
        except Exception:
            pass

        # 애널리스트 목표주가
        try:
            apt = ticker.analyst_price_targets
            if apt:
                earnings_result["analyst_price_targets"] = {
                    "current": safe_value(apt.get("current")),
                    "high": safe_value(apt.get("high")),
                    "low": safe_value(apt.get("low")),
                    "mean": safe_value(apt.get("mean")),
                    "median": safe_value(apt.get("median")),
                }
        except Exception:
            pass

        # 애널리스트 투자의견
        try:
            rec = ticker.recommendations
            if rec is not None and not rec.empty:
                for idx, row in rec.iterrows():
                    earnings_result["recommendations"].append({
                        "period": str(row.get("period")),
                        "strong_buy": int(row.get("strongBuy")) if row.get("strongBuy") else 0,
                        "buy": int(row.get("buy")) if row.get("buy") else 0,
                        "hold": int(row.get("hold")) if row.get("hold") else 0,
                        "sell": int(row.get("sell")) if row.get("sell") else 0,
                        "strong_sell": int(row.get("strongSell")) if row.get("strongSell") else 0,
                    })
        except Exception:
            pass

    except Exception as e:
        earnings_result["error"] = str(e)

    return earnings_result


def fetch_holdings_data(ticker) -> dict:
    """수급현황 데이터 수집 (기관 보유, 내부자 거래)"""
    holdings_result = {
        "major_holders": {},
        "institutional_holders": [],
        "insider_transactions": [],
        "insider_holders": []
    }

    try:
        # 주요 주주 비율
        try:
            major = ticker.major_holders
            if major is not None and not major.empty:
                for idx, row in major.iterrows():
                    key = str(row.iloc[1]).strip() if len(row) > 1 else str(idx)
                    value = row.iloc[0] if len(row) > 0 else None
                    # 퍼센트 문자열을 float로 변환
                    if isinstance(value, str) and '%' in value:
                        value = safe_value(float(value.replace('%', '')) / 100)
                    else:
                        value = safe_value(value)
                    holdings_result["major_holders"][key] = value
        except Exception:
            pass

        # 기관투자자 보유현황
        try:
            inst = ticker.institutional_holders
            if inst is not None and not inst.empty:
                for _, row in inst.iterrows():
                    date_reported = row.get("Date Reported")
                    if hasattr(date_reported, 'strftime'):
                        date_reported = date_reported.strftime("%Y-%m-%d")
                    else:
                        date_reported = str(date_reported) if date_reported else None

                    holdings_result["institutional_holders"].append({
                        "holder": row.get("Holder"),
                        "shares": int(row.get("Shares")) if row.get("Shares") else None,
                        "date_reported": date_reported,
                        "percent_out": safe_value(row.get("% Out")),
                        "value": safe_value(row.get("Value")),
                    })
        except Exception:
            pass

        # 내부자 거래
        try:
            insider_tx = ticker.insider_transactions
            if insider_tx is not None and not insider_tx.empty:
                for _, row in insider_tx.iterrows():
                    start_date = row.get("Start Date")
                    if hasattr(start_date, 'strftime'):
                        start_date = start_date.strftime("%Y-%m-%d")
                    else:
                        start_date = str(start_date) if start_date else None

                    holdings_result["insider_transactions"].append({
                        "insider": row.get("Insider"),
                        "position": row.get("Position"),
                        "transaction_type": row.get("Transaction"),
                        "start_date": start_date,
                        "shares": int(row.get("Shares")) if row.get("Shares") and not (isinstance(row.get("Shares"), float) and row.get("Shares") != row.get("Shares")) else None,
                        "value": safe_value(row.get("Value")),
                        "url": row.get("URL"),
                    })
        except Exception:
            pass

        # 내부자 보유현황
        try:
            insider_hold = ticker.insider_roster_holders
            if insider_hold is not None and not insider_hold.empty:
                for _, row in insider_hold.iterrows():
                    latest_date = row.get("Latest Transaction Date")
                    if hasattr(latest_date, 'strftime'):
                        latest_date = latest_date.strftime("%Y-%m-%d")
                    else:
                        latest_date = str(latest_date) if latest_date else None

                    position_direct = row.get("Position Direct Date")
                    if hasattr(position_direct, 'strftime'):
                        position_direct = position_direct.strftime("%Y-%m-%d")
                    else:
                        position_direct = str(position_direct) if position_direct else None

                    holdings_result["insider_holders"].append({
                        "name": row.get("Name"),
                        "position": row.get("Position"),
                        "shares_owned_direct": int(row.get("Shares Owned Direct")) if row.get("Shares Owned Direct") and not (isinstance(row.get("Shares Owned Direct"), float) and row.get("Shares Owned Direct") != row.get("Shares Owned Direct")) else None,
                        "shares_owned_indirect": int(row.get("Shares Owned Indirect")) if row.get("Shares Owned Indirect") and not (isinstance(row.get("Shares Owned Indirect"), float) and row.get("Shares Owned Indirect") != row.get("Shares Owned Indirect")) else None,
                        "latest_transaction_date": latest_date,
                        "position_direct_date": position_direct,
                        "url": row.get("URL"),
                    })
        except Exception:
            pass

    except Exception as e:
        holdings_result["error"] = str(e)

    return holdings_result


def fetch_options_data(ticker) -> dict:
    """옵션 데이터 수집 (콜/풋)"""
    options_result = {
        "expiration_dates": [],
        "chains": []
    }

    try:
        # 만기일 목록
        expiration_dates = ticker.options
        if not expiration_dates:
            return options_result

        options_result["expiration_dates"] = list(expiration_dates)

        # 각 만기일별 옵션 체인 (최대 3개 만기일만 가져옴 - API 부하 방지)
        for exp_date in expiration_dates[:3]:
            try:
                opt_chain = ticker.option_chain(exp_date)

                chain_data = {
                    "expiration_date": exp_date,
                    "calls": [],
                    "puts": []
                }

                # 콜 옵션
                if opt_chain.calls is not None and not opt_chain.calls.empty:
                    for _, row in opt_chain.calls.iterrows():
                        chain_data["calls"].append({
                            "contract_symbol": row.get("contractSymbol"),
                            "strike": safe_value(row.get("strike")),
                            "last_price": safe_value(row.get("lastPrice")),
                            "bid": safe_value(row.get("bid")),
                            "ask": safe_value(row.get("ask")),
                            "change": safe_value(row.get("change")),
                            "percent_change": safe_value(row.get("percentChange")),
                            "volume": int(row.get("volume")) if row.get("volume") and not (isinstance(row.get("volume"), float) and (row.get("volume") != row.get("volume"))) else None,
                            "open_interest": int(row.get("openInterest")) if row.get("openInterest") and not (isinstance(row.get("openInterest"), float) and (row.get("openInterest") != row.get("openInterest"))) else None,
                            "implied_volatility": safe_value(row.get("impliedVolatility")),
                            "in_the_money": bool(row.get("inTheMoney")) if row.get("inTheMoney") is not None else None,
                        })

                # 풋 옵션
                if opt_chain.puts is not None and not opt_chain.puts.empty:
                    for _, row in opt_chain.puts.iterrows():
                        chain_data["puts"].append({
                            "contract_symbol": row.get("contractSymbol"),
                            "strike": safe_value(row.get("strike")),
                            "last_price": safe_value(row.get("lastPrice")),
                            "bid": safe_value(row.get("bid")),
                            "ask": safe_value(row.get("ask")),
                            "change": safe_value(row.get("change")),
                            "percent_change": safe_value(row.get("percentChange")),
                            "volume": int(row.get("volume")) if row.get("volume") and not (isinstance(row.get("volume"), float) and (row.get("volume") != row.get("volume"))) else None,
                            "open_interest": int(row.get("openInterest")) if row.get("openInterest") and not (isinstance(row.get("openInterest"), float) and (row.get("openInterest") != row.get("openInterest"))) else None,
                            "implied_volatility": safe_value(row.get("impliedVolatility")),
                            "in_the_money": bool(row.get("inTheMoney")) if row.get("inTheMoney") is not None else None,
                        })

                options_result["chains"].append(chain_data)

            except Exception as e:
                continue

    except Exception as e:
        options_result["error"] = str(e)

    return options_result


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

        # 옵션 데이터
        result["options"] = fetch_options_data(ticker)

        # 수급현황 데이터
        result["holdings"] = fetch_holdings_data(ticker)

        # 실적/가이던스 데이터
        result["earnings"] = fetch_earnings_data(ticker)

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
