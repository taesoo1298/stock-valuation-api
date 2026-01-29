#!/usr/bin/env python3
"""
StockStory.org 투자 분석 데이터 크롤링 스크립트
Laravel에서 호출하여 JSON 형태로 데이터 반환

사용법: python fetch_stockstory.py <ticker> <exchange>
예시:   python fetch_stockstory.py meta nasdaq
"""

import sys
import json
import re
import math
import requests
from datetime import datetime


def safe_float(val):
    """안전한 float 변환"""
    if val is None:
        return None
    try:
        if isinstance(val, str):
            val = val.replace(",", "").replace("$", "").replace("%", "").strip()
            if not val or val in ("-", "N/A", "n/a", "—"):
                return None
        result = float(val)
        if math.isnan(result) or math.isinf(result):
            return None
        return result
    except (TypeError, ValueError):
        return None


def parse_dollar_amount(text):
    """'$59.89 billion', '$81.59B' 등 금액 텍스트를 숫자로 변환"""
    if not text or not isinstance(text, str):
        return None
    text = text.strip()

    match = re.search(r'\$?([\d,.]+)\s*(trillion|billion|million|thousand|T|B|M|K)?', text, re.IGNORECASE)
    if not match:
        return None

    num_str = match.group(1).replace(",", "")
    suffix = (match.group(2) or "").lower()

    try:
        num = float(num_str)
    except ValueError:
        return None

    multipliers = {
        "trillion": 1e12, "t": 1e12,
        "billion": 1e9, "b": 1e9,
        "million": 1e6, "m": 1e6,
        "thousand": 1e3, "k": 1e3,
        "": 1,
    }
    return num * multipliers.get(suffix, 1)


def parse_percent(text):
    """'23.8%' 또는 '23.8' 퍼센트 추출"""
    if not text or not isinstance(text, str):
        return None
    match = re.search(r'(-?[\d,.]+)\s*%', text)
    if match:
        try:
            return float(match.group(1).replace(",", ""))
        except ValueError:
            return None
    return None


def extract_json_ld(html):
    """JSON-LD structured data 추출"""
    pattern = r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>'
    matches = re.findall(pattern, html, re.DOTALL)
    results = []
    for m in matches:
        try:
            data = json.loads(m.strip())
            if isinstance(data, list):
                results.extend(data)
            else:
                results.append(data)
        except json.JSONDecodeError:
            continue
    return results


def strip_html(html_text):
    """HTML 태그 제거하고 텍스트만 추출"""
    text = re.sub(r'<script[^>]*>.*?</script>', ' ', html_text, flags=re.DOTALL)
    text = re.sub(r'<style[^>]*>.*?</style>', ' ', text, flags=re.DOTALL)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text


def extract_from_json_ld(json_ld_items, result):
    """JSON-LD에서 데이터 추출"""
    for item in json_ld_items:
        if not isinstance(item, dict):
            continue

        item_type = item.get("@type", "")

        # Corporation - 투자 요약
        if item_type == "Corporation":
            desc = item.get("description", "")
            if desc and len(desc) > 20:
                # HTML 태그 제거
                desc = re.sub(r'<[^>]+>', '', desc).strip()
                result["analysis_summary"] = desc

        # FAQPage - FAQ 답변에서 추가 정보 추출
        if item_type == "FAQPage":
            for entity in item.get("mainEntity", []):
                answer_text = ""
                accepted = entity.get("acceptedAnswer", {})
                if isinstance(accepted, dict):
                    answer_text = accepted.get("text", "")

                question = entity.get("name", "").lower()

                if "invest" in question or "thesis" in question or "worth" in question:
                    answer_clean = re.sub(r'<[^>]+>', '', answer_text).strip()
                    if answer_clean and len(answer_clean) > len(result.get("analysis_summary") or ""):
                        result["analysis_summary"] = answer_clean

        # WebPage - dateModified
        if item_type == "WebPage":
            result["_date_modified"] = item.get("dateModified")


def extract_from_html(html, result):
    """SSR HTML 본문에서 데이터 추출"""
    text = strip_html(html)

    # === 투자 등급 ===
    # HTML에서 첫 번째 등급 배지 영역만 추출 (다른 종목 언급 제외)
    # 페이지 상단 1/4만 검색하여 타 종목 배지 방지
    top_text = text[:len(text) // 4]
    quality_badges = ["High Quality", "Average Quality", "Low Quality"]
    value_badges = ["Timely Buy", "Fair Value", "Overvalued", "Outperform", "Underperform", "Market Perform"]
    rating_parts = []
    for badge in quality_badges:
        if badge in top_text:
            rating_parts.append(badge)
            break
    for badge in value_badges:
        if badge in top_text:
            rating_parts.append(badge)
            break
    if rating_parts:
        result["investment_rating"] = " / ".join(rating_parts)

    # === 최근 분기 라벨 ===
    quarter_match = re.search(r'(Q[1-4]\s+(?:FY|CY)\s*20\d{2})', text)
    if quarter_match:
        result["latest_quarter_label"] = quarter_match.group(1)

    # === 매출 (Revenue) ===
    # 패턴: "$59.89 billion" 근처에 revenue 키워드
    rev_match = re.search(
        r'[Rr]evenue[:\s]*\$?([\d,.]+)\s*(trillion|billion|million|T|B|M)',
        text, re.IGNORECASE
    )
    if rev_match:
        result["quarterly_revenue"] = parse_dollar_amount(f"${rev_match.group(1)} {rev_match.group(2)}")

    # 매출 beat 패턴: "X% analyst beat" or "X% beat" or "beating ... by X%"
    rev_beat = re.search(r'(?:revenue|sales).*?(\d+\.?\d*)%\s*(?:analyst\s*)?beat', text, re.IGNORECASE)
    if rev_beat:
        result["revenue_beat_percent"] = safe_float(rev_beat.group(1))
    else:
        # "beating ... estimates by X%"
        rev_beat2 = re.search(r'beat(?:ing)?\s+.*?(?:estimate|consensus).*?(?:by\s+)?(\d+\.?\d*)%', text, re.IGNORECASE)
        if rev_beat2:
            result["revenue_beat_percent"] = safe_float(rev_beat2.group(1))

    # 매출 miss
    rev_miss = re.search(r'(?:revenue|sales).*?(\d+\.?\d*)%\s*(?:analyst\s*)?miss', text, re.IGNORECASE)
    if rev_miss and not result["revenue_beat_percent"]:
        val = safe_float(rev_miss.group(1))
        if val is not None:
            result["revenue_beat_percent"] = -val

    # === EPS ===
    eps_match = re.search(
        r'(?:EPS|earnings per share)[^$]*\$(\d+\.?\d*)',
        text, re.IGNORECASE
    )
    if eps_match:
        result["quarterly_eps"] = safe_float(eps_match.group(1))

    # EPS beat: "$8.88 vs analyst estimates of $8.22 (8% beat)"
    eps_beat = re.search(r'\$[\d.]+\s*vs\s*analyst\s*estimates?\s*of\s*\$[\d.]+\s*\((\d+\.?\d*)%\s*beat\)', text, re.IGNORECASE)
    if eps_beat:
        result["eps_beat_percent"] = safe_float(eps_beat.group(1))
    else:
        eps_beat2 = re.search(r'EPS.*?(\d+\.?\d*)%\s*beat', text, re.IGNORECASE)
        if eps_beat2:
            result["eps_beat_percent"] = safe_float(eps_beat2.group(1))

    # EPS miss
    eps_miss = re.search(r'EPS.*?(\d+\.?\d*)%\s*miss', text, re.IGNORECASE)
    if eps_miss and not result["eps_beat_percent"]:
        val = safe_float(eps_miss.group(1))
        if val is not None:
            result["eps_beat_percent"] = -val

    # === Margins ===
    # Gross margin: "81.8% gross profit margin"
    gm_match = re.search(r'(\d+\.?\d*)%\s*gross\s*(?:profit\s*)?margin', text, re.IGNORECASE)
    if gm_match:
        result["gross_margin"] = safe_float(gm_match.group(1))
        result["quarterly_gross_margin"] = result["gross_margin"]

    # Operating margin: "operating margin ... 41.3%"
    om_match = re.search(r'operating\s*margin[^%]*?(\d+\.?\d*)%', text, re.IGNORECASE)
    if om_match:
        result["operating_margin"] = safe_float(om_match.group(1))
        result["quarterly_operating_margin"] = result["operating_margin"]
    else:
        om_match2 = re.search(r'(\d+\.?\d*)%\s*operating\s*margin', text, re.IGNORECASE)
        if om_match2:
            result["operating_margin"] = safe_float(om_match2.group(1))
            result["quarterly_operating_margin"] = result["operating_margin"]

    # Operating margin trend: "down from X%" or "up from X%"
    om_trend = re.search(r'operating\s*margin.*?(down|up)\s*from\s*(\d+\.?\d*)%', text, re.IGNORECASE)
    if om_trend:
        result["operating_margin_trend"] = om_trend.group(1).lower()

    # Gross margin trend
    gm_trend = re.search(r'gross.*?margin.*?(expanding|contracting|stable|improving|declining)', text, re.IGNORECASE)
    if gm_trend:
        result["gross_margin_trend"] = gm_trend.group(1).lower()

    # Free cash flow margin
    fcf_match = re.search(r'(\d+\.?\d*)%.*?free\s*cash\s*flow\s*margin', text, re.IGNORECASE)
    if not fcf_match:
        fcf_match = re.search(r'free\s*cash\s*flow\s*margin[^%]*?(\d+\.?\d*)%', text, re.IGNORECASE)

    # === Guidance ===
    # "$55 billion at the midpoint" or "guidance of $55B"
    guid_match = re.search(
        r'(?:guidance|outlook|forecast)[^$]*\$?([\d,.]+)\s*(trillion|billion|million|T|B|M)',
        text, re.IGNORECASE
    )
    if not guid_match:
        guid_match = re.search(
            r'\$([\d,.]+)\s*(trillion|billion|million|T|B|M)[^.]*(?:midpoint|guidance|outlook)',
            text, re.IGNORECASE
        )
    if guid_match:
        result["guidance_revenue"] = parse_dollar_amount(f"${guid_match.group(1)} {guid_match.group(2)}")

    # Guidance vs estimate: "7.1% above consensus" or "(7.1% above consensus)"
    guid_beat = re.search(r'(?:guidance|outlook|midpoint|forecast)[^.]*?(\d+\.?\d*)%\s*(?:above|ahead of|over)\s*(?:consensus|estimate|expectations|analysts)', text, re.IGNORECASE)
    if guid_beat:
        result["guidance_revenue_vs_estimate"] = safe_float(guid_beat.group(1))
    else:
        # Also try without guidance prefix: any "X% above consensus" near $ amounts
        guid_beat2 = re.search(r'(\d+\.?\d*)%\s*(?:above|ahead of)\s*(?:consensus|estimate|expectations)', text, re.IGNORECASE)
        if guid_beat2:
            result["guidance_revenue_vs_estimate"] = safe_float(guid_beat2.group(1))

    guid_miss = re.search(r'(?:guidance|outlook|midpoint|forecast)[^.]*?(\d+\.?\d*)%\s*(?:below|behind|under)\s*(?:consensus|estimate|expectations|analysts)', text, re.IGNORECASE)
    if guid_miss and not result["guidance_revenue_vs_estimate"]:
        val = safe_float(guid_miss.group(1))
        if val is not None:
            result["guidance_revenue_vs_estimate"] = -val

    # === Growth Metrics ===
    # "19.9% annualized revenue growth over the last three years"
    rev_cagr_5y = re.search(r'(\d+\.?\d*)%\s*(?:annualized\s*)?revenue\s*growth.*?(?:five|5)\s*year', text, re.IGNORECASE)
    if rev_cagr_5y:
        result["revenue_cagr_5y"] = safe_float(rev_cagr_5y.group(1))

    # 3-year fallback (StockStory often uses 3-year window)
    if not result["revenue_cagr_5y"]:
        rev_cagr_3y = re.search(r'(\d+\.?\d*)%\s*(?:annualized\s*)?revenue\s*growth.*?(?:three|3)\s*year', text, re.IGNORECASE)
        if rev_cagr_3y:
            result["revenue_cagr_5y"] = safe_float(rev_cagr_3y.group(1))

    rev_cagr_2y = re.search(r'(\d+\.?\d*)%\s*(?:annualized\s*)?revenue\s*growth.*?(?:two|2)\s*year', text, re.IGNORECASE)
    if rev_cagr_2y:
        result["revenue_cagr_2y"] = safe_float(rev_cagr_2y.group(1))

    # EPS CAGR: "EPS ... X% compounded annual growth rate" 또는 "earnings per share ... grew X%"
    # Must contain "EPS" or "earnings per share" in context to avoid matching revenue ARPU growth
    eps_cagr = re.search(r'(?:EPS|earnings\s*per\s*share)[^.]*?(\d+\.?\d*)%\s*(?:compounded\s*)?(?:annual\s*)?(?:growth|CAGR)', text, re.IGNORECASE)
    if eps_cagr:
        result["eps_cagr_5y"] = safe_float(eps_cagr.group(1))

    if not result["eps_cagr_5y"]:
        # "X% compounded annual growth rate" in EPS section context
        eps_cagr2 = re.search(r'(?:EPS|earnings)[^.]*?grew[^.]*?(\d+\.?\d*)%', text, re.IGNORECASE)
        if eps_cagr2:
            result["eps_cagr_5y"] = safe_float(eps_cagr2.group(1))

    # === Cash & Debt ===
    cash_match = re.search(r'\$([\d,.]+)\s*(trillion|billion|million|T|B|M)\s*(?:of\s*)?(?:in\s*)?cash', text, re.IGNORECASE)
    if cash_match:
        result["cash"] = parse_dollar_amount(f"${cash_match.group(1)} {cash_match.group(2)}")

    debt_match = re.search(r'\$([\d,.]+)\s*(trillion|billion|million|T|B|M)\s*(?:of\s*)?(?:in\s*)?debt', text, re.IGNORECASE)
    if debt_match:
        result["debt"] = parse_dollar_amount(f"${debt_match.group(1)} {debt_match.group(2)}")

    # Net debt / EBITDA
    nd_ebitda = re.search(r'net\s*debt.*?(\d+\.?\d*)x?\s*(?:times?\s*)?(?:EBITDA|ebitda)', text, re.IGNORECASE)
    if nd_ebitda:
        result["net_debt_to_ebitda"] = safe_float(nd_ebitda.group(1))

    # === ROIC ===
    roic_match = re.search(r'(?:ROIC|return on invested capital)[^%]*?(\d+\.?\d*)%', text, re.IGNORECASE)
    if roic_match:
        result["roic"] = safe_float(roic_match.group(1))

    # === Key Highlights ===
    # "We'd invest in..." 또는 "We wouldn't invest in..." 문장 추출
    invest_stmt = re.search(r"(We(?:'d|'re|\s+would)\s+(?:invest|not invest|pass|buy|sell)[^.]*\.(?:[^.]*\.)?)", text, re.IGNORECASE)
    if invest_stmt:
        stmt = invest_stmt.group(1).strip()
        if stmt and stmt not in result["key_highlights"]:
            result["key_highlights"].append(stmt)

    # EBITDA margin mention
    ebitda_margin = re.search(r'(\d+\.?\d*)%\s*(?:adjusted\s*)?EBITDA\s*margin', text, re.IGNORECASE)
    if ebitda_margin:
        margin_text = f"EBITDA Margin: {ebitda_margin.group(1)}%"
        if margin_text not in result["key_highlights"]:
            result["key_highlights"].append(margin_text)

    # Revenue YoY growth
    rev_yoy = re.search(r'(\d+\.?\d*)%\s*(?:year[- ]on[- ]year|YoY|year\s*over\s*year)\s*(?:revenue\s*)?(?:growth)?', text, re.IGNORECASE)
    if rev_yoy:
        yoy_text = f"Revenue YoY Growth: {rev_yoy.group(1)}%"
        if yoy_text not in result["key_highlights"]:
            result["key_highlights"].append(yoy_text)

    # Share count / buyback
    share_match = re.search(r'(?:share|stock)\s*(?:count|repurchase|buyback).*?(\d+\.?\d*)%\s*(?:annually|reduction|decrease)', text, re.IGNORECASE)
    if share_match:
        share_text = f"Share Count Reduction: {share_match.group(1)}% annually"
        if share_text not in result["key_highlights"]:
            result["key_highlights"].append(share_text)

    # EV/EBITDA valuation
    ev_match = re.search(r'(\d+\.?\d*)x?\s*(?:forward\s*)?EV/?EBITDA', text, re.IGNORECASE)
    if ev_match:
        ev_text = f"Forward EV/EBITDA: {ev_match.group(1)}x"
        if ev_text not in result["key_highlights"]:
            result["key_highlights"].append(ev_text)

    # Analyst price target
    pt_match = re.search(r'(?:analyst|consensus|average)\s*(?:price\s*)?target[:\s]*\$([\d,.]+)', text, re.IGNORECASE)
    if pt_match:
        pt_text = f"Analyst Price Target: ${pt_match.group(1)}"
        if pt_text not in result["key_highlights"]:
            result["key_highlights"].append(pt_text)

    # Market cap
    mcap_match = re.search(r'market\s*cap[:\s]*\$?([\d,.]+)\s*(trillion|billion|million|T|B|M)', text, re.IGNORECASE)
    if mcap_match:
        mcap_text = f"Market Cap: ${mcap_match.group(1)} {mcap_match.group(2)}"
        if mcap_text not in result["key_highlights"]:
            result["key_highlights"].append(mcap_text)

    # === Chart Image URLs ===
    # Only include actual chart images (chart-images path), not company logos
    img_matches = re.findall(r'<img[^>]*src="(https?://[^"]*chart-images[^"]*\.png)"', html, re.IGNORECASE)
    for img_url in img_matches:
        if img_url not in result["chart_urls"]:
            result["chart_urls"].append(img_url)

    data_src = re.findall(r'data-src="(https?://[^"]*chart-images[^"]*\.png)"', html, re.IGNORECASE)
    for img_url in data_src:
        if img_url not in result["chart_urls"]:
            result["chart_urls"].append(img_url)


def fetch_stockstory(ticker, exchange):
    """StockStory.org에서 종목 데이터 크롤링"""
    url = f"https://stockstory.org/us/stocks/{exchange.lower()}/{ticker.lower()}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Cache-Control": "no-cache",
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)

        if response.status_code == 404:
            return {
                "success": False,
                "ticker": ticker.upper(),
                "error": f"Stock page not found: {url}",
                "timestamp": datetime.now().isoformat(),
            }

        if response.status_code != 200:
            return {
                "success": False,
                "ticker": ticker.upper(),
                "error": f"HTTP {response.status_code}: Failed to fetch {url}",
                "timestamp": datetime.now().isoformat(),
            }

        html = response.text

        # 결과 초기화
        result = {
            "investment_rating": None,
            "analysis_summary": None,
            "latest_quarter_label": None,
            "quarterly_revenue": None,
            "quarterly_eps": None,
            "quarterly_gross_margin": None,
            "quarterly_operating_margin": None,
            "revenue_beat_percent": None,
            "eps_beat_percent": None,
            "guidance_revenue": None,
            "guidance_eps": None,
            "guidance_revenue_vs_estimate": None,
            "guidance_eps_vs_estimate": None,
            "revenue_cagr_5y": None,
            "revenue_cagr_2y": None,
            "eps_cagr_5y": None,
            "wall_street_revenue_estimate": None,
            "wall_street_eps_estimate": None,
            "gross_margin": None,
            "operating_margin": None,
            "gross_margin_trend": None,
            "operating_margin_trend": None,
            "roic": None,
            "cash": None,
            "debt": None,
            "net_debt_to_ebitda": None,
            "quality_score": None,
            "value_score": None,
            "key_highlights": [],
            "chart_urls": [],
        }

        # 1. JSON-LD에서 데이터 추출
        json_ld_items = extract_json_ld(html)
        extract_from_json_ld(json_ld_items, result)

        # 2. SSR HTML 본문에서 데이터 추출 (핵심)
        extract_from_html(html, result)

        # 임시 키 제거
        result.pop("_date_modified", None)

        return {
            "success": True,
            "ticker": ticker.upper(),
            "exchange": exchange.upper(),
            "url": url,
            "timestamp": datetime.now().isoformat(),
            "data": result,
        }

    except requests.Timeout:
        return {
            "success": False,
            "ticker": ticker.upper(),
            "error": "Request timeout",
            "timestamp": datetime.now().isoformat(),
        }
    except requests.RequestException as e:
        return {
            "success": False,
            "ticker": ticker.upper(),
            "error": f"Request failed: {str(e)}",
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        return {
            "success": False,
            "ticker": ticker.upper(),
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }


if __name__ == "__main__":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

    if len(sys.argv) < 3:
        print(json.dumps({
            "success": False,
            "error": "Usage: python fetch_stockstory.py <ticker> <exchange>"
        }))
        sys.exit(1)

    ticker_symbol = sys.argv[1]
    exchange_name = sys.argv[2]

    result = fetch_stockstory(ticker_symbol, exchange_name)
    print(json.dumps(result, ensure_ascii=False))
