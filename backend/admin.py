import os
import base64
import random
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from motor.motor_asyncio import AsyncIOMotorClient
import secrets
from datetime import datetime, timedelta
import pytz
from typing import Optional

admin_router = APIRouter()
security = HTTPBasic()

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

def verify_admin_credentials(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials against environment variables"""
    admin_user = os.environ.get('ADMIN_USER')
    admin_pass = os.environ.get('ADMIN_PASS')
    
    # Deny access if environment variables are missing
    if not admin_user or not admin_pass:
        raise HTTPException(
            status_code=401,
            detail="Admin credentials not configured",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    # Verify username and password
    is_correct_username = secrets.compare_digest(credentials.username, admin_user)
    is_correct_password = secrets.compare_digest(credentials.password, admin_pass)
    
    if not (is_correct_username and is_correct_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    return credentials.username

def get_date_range(days: int):
    """Get date range for the specified number of days in Asia/Tokyo timezone"""
    tokyo_tz = pytz.timezone('Asia/Tokyo')
    now = datetime.now(tokyo_tz)
    start_date = now - timedelta(days=days)
    return start_date, now

async def calculate_overview_metrics(days: int = 7):
    """Calculate overview metrics for the specified date range"""
    start_date, end_date = get_date_range(days)
    
    # Convert to UTC for MongoDB queries
    start_utc = start_date.astimezone(pytz.UTC)
    end_utc = end_date.astimezone(pytz.UTC)
    
    try:
        # Total searches
        total_searches = await db.session_telemetry.count_documents({
            "type": "session_feedback",
            "created_at": {"$gte": start_utc, "$lte": end_utc}
        })
        
        # Active users (unique anonIds)
        active_users_pipeline = [
            {"$match": {"created_at": {"$gte": start_utc, "$lte": end_utc}}},
            {"$group": {"_id": "$anonId"}},
            {"$count": "unique_users"}
        ]
        active_users_result = await db.session_telemetry.aggregate(active_users_pipeline).to_list(1)
        active_users = active_users_result[0]["unique_users"] if active_users_result else 0
        
        # Success rate (ideal_match feedback)
        success_count = await db.session_telemetry.count_documents({
            "type": "session_feedback",
            "value": "ideal_match",
            "created_at": {"$gte": start_utc, "$lte": end_utc}
        })
        success_rate = (success_count / total_searches * 100) if total_searches > 0 else 0
        
        # Mismatch reports
        mismatch_reports = await db.allergen_feedback.count_documents({
            "event": "report_allergen_mismatch",
            "created_at": {"$gte": start_utc, "$lte": end_utc}
        })
        
        # Calculate complex metrics (placeholder values for now since we don't have tracking data)
        # In a real implementation, these would be calculated from user interaction events
        
        # Mock calculations for demonstration
        top3_impressions = total_searches * 3  # Assuming 3 results shown per search
        top3_clicks = int(success_count * 1.5)  # Estimate based on successful searches
        top3_ctr = (top3_clicks / top3_impressions * 100) if top3_impressions > 0 else 0
        
        # Short dwell rate (mock calculation)
        total_clicks = top3_clicks
        short_dwell_clicks = int(total_clicks * 0.15)  # Assume 15% have short dwell time
        short_dwell_rate = (short_dwell_clicks / total_clicks * 100) if total_clicks > 0 else 0
        
        # Alt no click rate (mock calculation)
        sessions_with_alt = int(total_searches * 0.3)  # Assume 30% use alternative sets
        alt_no_click = int(sessions_with_alt * 0.08)  # Assume 8% of alt users don't click
        alt_no_click_rate = (alt_no_click / total_searches * 100) if total_searches > 0 else 0
        
        # Zero result rate (mock calculation)
        zero_results = int(total_searches * 0.02)  # Assume 2% get zero results
        zero_result_rate = (zero_results / total_searches * 100) if total_searches > 0 else 0
        
        # Response time (mock)
        avg_response_time = 450  # ms
        
        return {
            "total_searches": total_searches,
            "active_users": active_users,
            "success_rate": round(success_rate, 1),
            "avg_response_time": avg_response_time,
            "top3_ctr": round(top3_ctr, 2),
            "short_dwell_rate": round(short_dwell_rate, 2),
            "alt_no_click_rate": round(alt_no_click_rate, 2),
            "zero_result_rate": round(zero_result_rate, 2),
            "mismatch_reports": mismatch_reports
        }
        
    except Exception as e:
        print(f"Error calculating metrics: {e}")
        return {
            "total_searches": 0,
            "active_users": 0,
            "success_rate": 0,
            "avg_response_time": 0,
            "top3_ctr": 0,
            "short_dwell_rate": 0,
            "alt_no_click_rate": 0,
            "zero_result_rate": 0,
            "mismatch_reports": 0
        }

async def calculate_context_metrics(days: int = 7):
    """Calculate context-specific metrics for the admin dashboard"""
    start_date, end_date = get_date_range(days)
    
    # Convert to UTC for MongoDB queries
    start_utc = start_date.astimezone(pytz.UTC)
    end_utc = end_date.astimezone(pytz.UTC)
    
    contexts = ["時短", "イベント", "健康", "初心者"]
    context_metrics = {}
    
    try:
        for context in contexts:
            # Get total sessions for this context
            total_sessions = await db.session_telemetry.count_documents({
                "type": "session_feedback",
                "context": context,
                "created_at": {"$gte": start_utc, "$lte": end_utc}
            })
            
            if total_sessions == 0:
                context_metrics[context] = {
                    "total_sessions": 0,
                    "ctr": 0,
                    "ideal_match_rate": 0,
                    "not_found_rate": 0,
                    "allergen_rate": 0,
                    "suggestions": []
                }
                continue
            
            # Calculate feedback distribution
            feedback_pipeline = [
                {"$match": {
                    "type": "session_feedback",
                    "context": context,
                    "created_at": {"$gte": start_utc, "$lte": end_utc}
                }},
                {"$group": {
                    "_id": "$value",
                    "count": {"$sum": 1}
                }}
            ]
            
            feedback_results = await db.session_telemetry.aggregate(feedback_pipeline).to_list(10)
            feedback_counts = {result["_id"]: result["count"] for result in feedback_results}
            
            ideal_match_count = feedback_counts.get("ideal_match", 0)
            not_found_count = feedback_counts.get("not_found", 0)
            allergen_count = feedback_counts.get("allergen_included", 0)
            
            # Calculate rates
            ideal_match_rate = (ideal_match_count / total_sessions * 100) if total_sessions > 0 else 0
            not_found_rate = (not_found_count / total_sessions * 100) if total_sessions > 0 else 0
            allergen_rate = (allergen_count / total_sessions * 100) if total_sessions > 0 else 0
            
            # Mock CTR calculation (in real implementation, this would be from click tracking)
            # Simulate CTR based on context effectiveness
            base_ctr = {
                "時短": 52.0,  # Quick recipes tend to have higher CTR
                "イベント": 38.5,  # Event recipes lower CTR
                "健康": 47.2,  # Health recipes decent CTR
                "初心者": 41.8   # Beginner recipes lower CTR
            }
            
            # Adjust CTR based on actual success rate
            success_factor = ideal_match_rate / 60.0  # Normalize around 60% success
            simulated_ctr = base_ctr[context] * success_factor
            simulated_ctr = max(25.0, min(75.0, simulated_ctr))  # Keep realistic bounds
            
            # Generate suggestions based on thresholds
            suggestions = []
            if simulated_ctr < 45:
                suggestions.append({
                    "type": "ctr_low",
                    "message": f"CTRが低い (< 45%): {context}コンテキストの重み付けを+10%に調整することを推奨",
                    "action": f"weight_boost_{context}"
                })
            
            if ideal_match_rate < 50:
                suggestions.append({
                    "type": "success_low", 
                    "message": f"成功率が低い (< 50%): {context}向けキャッチフレーズ抽出の強化を推奨",
                    "action": f"catchphrase_boost_{context}"
                })
            
            context_metrics[context] = {
                "total_sessions": total_sessions,
                "ctr": round(simulated_ctr, 1),
                "ideal_match_rate": round(ideal_match_rate, 1),
                "not_found_rate": round(not_found_rate, 1), 
                "allergen_rate": round(allergen_rate, 1),
                "suggestions": suggestions
            }
            
        return context_metrics
        
    except Exception as e:
        print(f"Error calculating context metrics: {e}")
        return {context: {
            "total_sessions": 0,
            "ctr": 0,
            "ideal_match_rate": 0,
            "not_found_rate": 0,
            "allergen_rate": 0,
            "suggestions": []
        } for context in contexts}

async def calculate_quality_metrics(days: int = 7):
    """Calculate quality metrics including allergen verdicts and mismatch analysis"""
    start_date, end_date = get_date_range(days)
    
    # Convert to UTC for MongoDB queries
    start_utc = start_date.astimezone(pytz.UTC)
    end_utc = end_date.astimezone(pytz.UTC)
    
    try:
        # Generate daily allergen verdict data (mock implementation)
        # In real implementation, this would come from recipe analysis pipeline
        daily_verdicts = []
        tokyo_tz = pytz.timezone('Asia/Tokyo')
        
        for i in range(days):
            date = start_date + timedelta(days=i)
            date_str = date.strftime('%m/%d')
            
            # Mock daily verdict distribution (would come from actual allergen analysis)
            total_recipes = random.randint(15, 35)
            ok_count = int(total_recipes * random.uniform(0.65, 0.85))
            ng_count = int(total_recipes * random.uniform(0.08, 0.15))
            unknown_count = total_recipes - ok_count - ng_count
            
            daily_verdicts.append({
                "date": date_str,
                "ok": ok_count,
                "ng": ng_count, 
                "unknown": unknown_count,
                "total": total_recipes
            })
        
        # Get latest allergen mismatch reports
        mismatch_reports = await db.allergen_feedback.find({
            "event": "report_allergen_mismatch",
            "created_at": {"$gte": start_utc, "$lte": end_utc}
        }).sort("created_at", -1).limit(10).to_list(10)
        
        # Process mismatch reports
        processed_reports = []
        for report in mismatch_reports:
            # Extract domain from query or context
            domain_mapping = {
                "カレー": "cookpad.com",
                "パスタ": "kurashiru.com", 
                "ケーキ": "recipe.rakuten.co.jp",
                "サラダ": "delish-kitchen.tv",
                "炒飯": "cookpad.com",
                "味噌汁": "kurashiru.com",
                "ハンバーグ": "recipe.rakuten.co.jp"
            }
            
            domain = domain_mapping.get(report.get('query', ''), 'unknown.com')
            
            # Generate snippet based on query and context
            query = report.get('query', 'レシピ')
            context = report.get('context', '一般')
            snippet = f"{context}向け{query}レシピに含有アレルゲン検出"
            
            processed_reports.append({
                "timestamp": report['created_at'].strftime('%Y-%m-%d %H:%M:%S'),
                "domain": domain,
                "snippet": snippet,
                "recipe_id": report.get('recipeId', 'N/A')
            })
        
        # Dictionary expansion candidates (mock implementation)
        # In real implementation, this would analyze Unknown/NG items for new allergen terms
        expansion_candidates = [
            "グルテン含有", "乳糖不耐", "大豆由来", "魚介エキス", "鶏肉エキス",
            "アーモンド粉", "カシューナッツ", "ピーナッツオイル", "ごま油", "魚醤",
            "昆布エキス", "鰹節", "チーズ粉末", "バター風味", "マヨネーズ"
        ]
        
        # Calculate overall quality metrics
        total_verdicts = sum(day['total'] for day in daily_verdicts)
        total_ok = sum(day['ok'] for day in daily_verdicts)
        total_ng = sum(day['ng'] for day in daily_verdicts) 
        total_unknown = sum(day['unknown'] for day in daily_verdicts)
        
        quality_score = (total_ok / total_verdicts * 100) if total_verdicts > 0 else 0
        
        return {
            "daily_verdicts": daily_verdicts,
            "mismatch_reports": processed_reports,
            "expansion_candidates": expansion_candidates,
            "summary": {
                "total_analyzed": total_verdicts,
                "ok_rate": round((total_ok / total_verdicts * 100) if total_verdicts > 0 else 0, 1),
                "ng_rate": round((total_ng / total_verdicts * 100) if total_verdicts > 0 else 0, 1),
                "unknown_rate": round((total_unknown / total_verdicts * 100) if total_verdicts > 0 else 0, 1),
                "quality_score": round(quality_score, 1),
                "mismatch_count": len(processed_reports)
            }
        }
        
    except Exception as e:
        print(f"Error calculating quality metrics: {e}")
        return {
            "daily_verdicts": [],
            "mismatch_reports": [],
            "expansion_candidates": [],
            "summary": {
                "total_analyzed": 0,
                "ok_rate": 0,
                "ng_rate": 0,
                "unknown_rate": 0,
                "quality_score": 0,
                "mismatch_count": 0
            }
        }

async def get_daily_trends(days: int = 7):
    """Get daily trend data for charts"""
    start_date, end_date = get_date_range(days)
    
    # Generate daily data points
    daily_data = []
    tokyo_tz = pytz.timezone('Asia/Tokyo')
    
    for i in range(days):
        date = start_date + timedelta(days=i)
        date_str = date.strftime('%m/%d')
        
        # Calculate daily metrics (mock data based on patterns)
        base_ctr = 12.5 + (i * 0.3) + (i % 3) * 1.2  # Trending upward with variance
        base_dwell = 18.0 - (i * 0.2) + (i % 4) * 0.8  # Slight improvement over time
        
        daily_data.append({
            "date": date_str,
            "top3_ctr": round(base_ctr, 1),
            "short_dwell_rate": round(base_dwell, 1)
        })
    
    return daily_data

@admin_router.get("/api/admin/overview-metrics")
async def get_overview_metrics(
    days: int = Query(7, description="Number of days to analyze"),
    current_user: str = Depends(verify_admin_credentials)
):
    """Get overview metrics for the admin dashboard"""
    metrics = await calculate_overview_metrics(days)
    return JSONResponse(content=metrics)

@admin_router.get("/api/admin/daily-trends")
async def get_daily_trends_api(
    days: int = Query(7, description="Number of days for trend data"),
    current_user: str = Depends(verify_admin_credentials)
):
    """Get daily trend data for charts"""
    trends = await get_daily_trends(days)
    return JSONResponse(content=trends)

@admin_router.get("/api/admin/context-metrics")
async def get_context_metrics_api(
    days: int = Query(7, description="Number of days to analyze"),
    current_user: str = Depends(verify_admin_credentials)
):
    """Get context-specific metrics for the admin dashboard"""
    metrics = await calculate_context_metrics(days)
    return JSONResponse(content=metrics)

@admin_router.get("/api/admin/quality-metrics")
async def get_quality_metrics_api(
    days: int = Query(7, description="Number of days to analyze"),
    current_user: str = Depends(verify_admin_credentials)
):
    """Get quality metrics including allergen verdicts and mismatch analysis"""
    metrics = await calculate_quality_metrics(days)
    return JSONResponse(content=metrics)

@admin_router.get("/admin", response_class=HTMLResponse)
async def admin_dashboard(current_user: str = Depends(verify_admin_credentials)):
    """Admin dashboard with Basic Auth protection"""
    
    html_content = """
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Anshin Recipe Admin Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body { font-family: "Noto Sans JP", system-ui, sans-serif; }
        </style>
    </head>
    <body class="bg-gray-100">
        <div class="flex h-screen">
            <!-- Sidebar -->
            <div class="w-64 bg-white shadow-lg">
                <div class="p-6 border-b">
                    <h1 class="text-xl font-bold text-gray-900">あんしんレシピ</h1>
                    <p class="text-sm text-gray-600">Admin Dashboard</p>
                </div>
                
                <!-- Navigation -->
                <nav class="mt-6">
                    <div class="px-3">
                        <button onclick="showSection('overview')" class="nav-item w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-900 bg-green-50 hover:bg-green-100">
                            📊 Overview
                        </button>
                        <button onclick="showSection('context')" class="nav-item w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 mt-1">
                            🎯 Context
                        </button>
                        <button onclick="showSection('quality')" class="nav-item w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 mt-1">
                            ⭐ Quality
                        </button>
                        <button onclick="showSection('funnel')" class="nav-item w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 mt-1">
                            🔄 Funnel
                        </button>
                        <button onclick="showSection('extract')" class="nav-item w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 mt-1">
                            📈 Extract
                        </button>
                        <button onclick="showSection('domains')" class="nav-item w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 mt-1">
                            🌐 Domains
                        </button>
                    </div>
                </nav>

                <!-- Date Range Picker -->
                <div class="px-6 mt-8">
                    <h3 class="text-sm font-medium text-gray-700 mb-3">期間選択</h3>
                    <div class="space-y-2">
                        <button onclick="setDateRange(7)" class="date-btn w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                            過去7日間
                        </button>
                        <button onclick="setDateRange(30)" class="date-btn w-full text-left px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100">
                            過去30日間
                        </button>
                        <button onclick="setDateRange(90)" class="date-btn w-full text-left px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-100">
                            過去90日間
                        </button>
                    </div>
                    <div class="mt-4 text-xs text-gray-500">
                        選択期間: <span id="currentRange">過去7日間</span>
                    </div>
                </div>

                <!-- User Info -->
                <div class="absolute bottom-6 left-6 right-6">
                    <div class="px-3 py-2 bg-gray-50 rounded-lg">
                        <div class="text-xs text-gray-600">ログイン中:</div>
                        <div class="text-sm font-medium text-gray-900">""" + current_user + """</div>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="flex-1 overflow-auto">
                <div class="p-8">
                    <!-- Overview Section -->
                    <div id="overview-section" class="content-section">
                        <div class="mb-8">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">Overview</h2>
                            <p class="text-gray-600">全体的なシステム概要とメトリクス (Asia/Tokyo)</p>
                        </div>

                        <!-- Loading Indicator -->
                        <div id="loading-indicator" class="text-center py-8">
                            <div class="text-gray-600">データを読み込み中...</div>
                        </div>

                        <!-- Main Content (initially hidden) -->
                        <div id="main-content" style="display: none;">
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <!-- KPI Cards -->
                                <div class="bg-white p-6 rounded-lg shadow">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm font-medium text-gray-600">総検索数</p>
                                            <p id="total-searches" class="text-2xl font-bold text-gray-900">-</p>
                                        </div>
                                        <div class="p-3 bg-blue-50 rounded-full">
                                            <div class="w-6 h-6 text-blue-600">🔍</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-white p-6 rounded-lg shadow">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm font-medium text-gray-600">アクティブユーザー</p>
                                            <p id="active-users" class="text-2xl font-bold text-gray-900">-</p>
                                        </div>
                                        <div class="p-3 bg-green-50 rounded-full">
                                            <div class="w-6 h-6 text-green-600">👥</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-white p-6 rounded-lg shadow">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm font-medium text-gray-600">成功率</p>
                                            <p id="success-rate" class="text-2xl font-bold text-gray-900">-%</p>
                                        </div>
                                        <div class="p-3 bg-yellow-50 rounded-full">
                                            <div class="w-6 h-6 text-yellow-600">📊</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="bg-white p-6 rounded-lg shadow">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="text-sm font-medium text-gray-600">レスポンス時間</p>
                                            <p id="response-time" class="text-2xl font-bold text-gray-900">-ms</p>
                                        </div>
                                        <div class="p-3 bg-purple-50 rounded-full">
                                            <div class="w-6 h-6 text-purple-600">⚡</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Additional Metrics Row -->
                            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                                <div class="bg-white p-4 rounded-lg shadow text-center">
                                    <div class="text-sm text-gray-600">Top3 CTR</div>
                                    <div id="top3-ctr" class="text-lg font-bold text-blue-600">-%</div>
                                </div>
                                <div class="bg-white p-4 rounded-lg shadow text-center">
                                    <div class="text-sm text-gray-600">短滞在率</div>
                                    <div id="short-dwell" class="text-lg font-bold text-orange-600">-%</div>
                                </div>
                                <div class="bg-white p-4 rounded-lg shadow text-center">
                                    <div class="text-sm text-gray-600">Alt無クリック率</div>
                                    <div id="alt-no-click" class="text-lg font-bold text-red-600">-%</div>
                                </div>
                                <div class="bg-white p-4 rounded-lg shadow text-center">
                                    <div class="text-sm text-gray-600">結果0率</div>
                                    <div id="zero-result" class="text-lg font-bold text-gray-600">-%</div>
                                </div>
                                <div class="bg-white p-4 rounded-lg shadow text-center">
                                    <div class="text-sm text-gray-600">不一致報告</div>
                                    <div id="mismatch-reports" class="text-lg font-bold text-red-600">-</div>
                                </div>
                            </div>

                            <!-- Charts Row -->
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div class="bg-white p-6 rounded-lg shadow">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Top3 CTR 推移</h3>
                                    <canvas id="top3CtrChart" width="400" height="200"></canvas>
                                </div>

                                <div class="bg-white p-6 rounded-lg shadow">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4">短滞在率 推移</h3>
                                    <canvas id="shortDwellChart" width="400" height="200"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Other sections remain the same -->
                    <!-- Context Section -->
                    <div id="context-section" class="content-section hidden">
                        <div class="mb-8">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">Context Analysis</h2>
                            <p class="text-gray-600">コンテキスト選択の分析とパフォーマンス (Asia/Tokyo)</p>
                        </div>

                        <!-- Loading Indicator for Context -->
                        <div id="context-loading-indicator" class="text-center py-8">
                            <div class="text-gray-600">コンテキストデータを読み込み中...</div>
                        </div>

                        <!-- Context Content (initially hidden) -->
                        <div id="context-content" style="display: none;">
                            <!-- Suggestions Panel -->
                            <div id="suggestions-panel" class="mb-6" style="display: none;">
                                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h3 class="text-lg font-semibold text-yellow-800 mb-3">🔍 改善提案</h3>
                                    <div id="suggestions-list" class="space-y-2"></div>
                                </div>
                            </div>

                            <!-- Context Metrics Table -->
                            <div class="bg-white rounded-lg shadow overflow-hidden">
                                <div class="px-6 py-4 border-b">
                                    <h3 class="text-lg font-semibold text-gray-900">コンテキスト別パフォーマンス</h3>
                                </div>
                                <div class="overflow-x-auto">
                                    <table class="min-w-full">
                                        <thead class="bg-gray-50">
                                            <tr>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">コンテキスト</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">セッション数</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">◯ 出会えた</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">△ 出会えなかった</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">✕ アレルゲン含有</th>
                                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状態</th>
                                            </tr>
                                        </thead>
                                        <tbody id="context-table-body" class="bg-white divide-y divide-gray-200">
                                            <!-- Dynamic content will be inserted here -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Context Performance Heatmap -->
                            <div class="mt-6 bg-white p-6 rounded-lg shadow">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">パフォーマンスヒートマップ</h3>
                                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div id="context-heatmap-quick" class="context-heatmap-cell p-4 rounded-lg border-2 text-center">
                                        <div class="font-medium text-sm text-gray-600">時短</div>
                                        <div class="text-2xl font-bold mt-2">-</div>
                                        <div class="text-xs text-gray-500 mt-1">CTR</div>
                                    </div>
                                    <div id="context-heatmap-event" class="context-heatmap-cell p-4 rounded-lg border-2 text-center">
                                        <div class="font-medium text-sm text-gray-600">イベント</div>
                                        <div class="text-2xl font-bold mt-2">-</div>
                                        <div class="text-xs text-gray-500 mt-1">CTR</div>
                                    </div>
                                    <div id="context-heatmap-health" class="context-heatmap-cell p-4 rounded-lg border-2 text-center">
                                        <div class="font-medium text-sm text-gray-600">健康</div>
                                        <div class="text-2xl font-bold mt-2">-</div>
                                        <div class="text-xs text-gray-500 mt-1">CTR</div>
                                    </div>
                                    <div id="context-heatmap-beginner" class="context-heatmap-cell p-4 rounded-lg border-2 text-center">
                                        <div class="font-medium text-sm text-gray-600">初心者</div>
                                        <div class="text-2xl font-bold mt-2">-</div>
                                        <div class="text-xs text-gray-500 mt-1">CTR</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="quality-section" class="content-section hidden">
                        <div class="mb-8">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">Quality Metrics</h2>
                            <p class="text-gray-600">あんしんスコアと品質指標の分析</p>
                        </div>
                        <div class="bg-white p-6 rounded-lg shadow">
                            <p class="text-gray-600">Quality metrics data will be implemented...</p>
                        </div>
                    </div>

                    <div id="funnel-section" class="content-section hidden">
                        <div class="mb-8">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">User Funnel</h2>
                            <p class="text-gray-600">ユーザーの行動フローとコンバージョン分析</p>
                        </div>
                        <div class="bg-white p-6 rounded-lg shadow">
                            <p class="text-gray-600">Funnel analysis data will be implemented...</p>
                        </div>
                    </div>

                    <div id="extract-section" class="content-section hidden">
                        <div class="mb-8">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">Data Extract</h2>
                            <p class="text-gray-600">データエクスポートと分析ツール</p>
                        </div>
                        <div class="bg-white p-6 rounded-lg shadow">
                            <p class="text-gray-600">Data extraction tools will be implemented...</p>
                        </div>
                    </div>

                    <div id="domains-section" class="content-section hidden">
                        <div class="mb-8">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">Domain Analysis</h2>
                            <p class="text-gray-600">レシピソースドメインのパフォーマンス分析</p>
                        </div>
                        <div class="bg-white p-6 rounded-lg shadow">
                            <p class="text-gray-600">Domain analysis data will be implemented...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            let currentSection = 'overview';
            let currentDateRange = 7;
            let chartInstances = {};

            function showSection(section) {
                // Hide all sections
                document.querySelectorAll('.content-section').forEach(el => {
                    el.classList.add('hidden');
                });
                
                // Show selected section
                document.getElementById(section + '-section').classList.remove('hidden');
                
                // Update navigation
                document.querySelectorAll('.nav-item').forEach(el => {
                    el.classList.remove('bg-green-50', 'text-gray-900');
                    el.classList.add('text-gray-700');
                });
                
                event.target.classList.add('bg-green-50', 'text-gray-900');
                event.target.classList.remove('text-gray-700');
                
                currentSection = section;
                
                if (section === 'overview') {
                    loadOverviewData();
                } else if (section === 'context') {
                    loadContextData();
                }
            }

            function setDateRange(days) {
                currentDateRange = days;
                
                // Update button styles
                document.querySelectorAll('.date-btn').forEach(el => {
                    el.classList.remove('bg-blue-50', 'text-blue-700');
                    el.classList.add('text-gray-700');
                });
                
                event.target.classList.add('bg-blue-50', 'text-blue-700');
                event.target.classList.remove('text-gray-700');
                
                // Update display
                const rangeText = days === 7 ? '過去7日間' : days === 30 ? '過去30日間' : '過去90日間';
                document.getElementById('currentRange').textContent = rangeText;
                
                // Reload data if we're on overview or context
                if (currentSection === 'overview') {
                    loadOverviewData();
                } else if (currentSection === 'context') {
                    loadContextData();
                }
            }

            async function loadOverviewData() {
                document.getElementById('loading-indicator').style.display = 'block';
                document.getElementById('main-content').style.display = 'none';

                try {
                    // Load metrics using XMLHttpRequest
                    const metrics = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', `/api/admin/overview-metrics?days=${currentDateRange}`, true);
                        xhr.withCredentials = true;
                        xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                                if (xhr.status === 200) {
                                    resolve(JSON.parse(xhr.responseText));
                                } else {
                                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                                }
                            }
                        };
                        xhr.send();
                    });
                    
                    // Update KPI cards
                    document.getElementById('total-searches').textContent = metrics.total_searches.toLocaleString();
                    document.getElementById('active-users').textContent = metrics.active_users.toLocaleString();
                    document.getElementById('success-rate').textContent = metrics.success_rate + '%';
                    document.getElementById('response-time').textContent = metrics.avg_response_time + 'ms';
                    
                    // Update additional metrics
                    document.getElementById('top3-ctr').textContent = metrics.top3_ctr + '%';
                    document.getElementById('short-dwell').textContent = metrics.short_dwell_rate + '%';
                    document.getElementById('alt-no-click').textContent = metrics.alt_no_click_rate + '%';
                    document.getElementById('zero-result').textContent = metrics.zero_result_rate + '%';
                    document.getElementById('mismatch-reports').textContent = metrics.mismatch_reports;

                    // Load trend data
                    const trends = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', `/api/admin/daily-trends?days=${currentDateRange}`, true);
                        xhr.withCredentials = true;
                        xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                                if (xhr.status === 200) {
                                    resolve(JSON.parse(xhr.responseText));
                                } else {
                                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                                }
                            }
                        };
                        xhr.send();
                    });
                    
                    // Initialize charts
                    initializeTrendCharts(trends);
                    
                    document.getElementById('loading-indicator').style.display = 'none';
                    document.getElementById('main-content').style.display = 'block';
                    
                } catch (error) {
                    console.error('Error loading overview data:', error);
                    document.getElementById('loading-indicator').innerHTML = '<div class="text-red-600">データの読み込みに失敗しました: ' + error.message + '</div>';
                }
            }

            async function loadContextData() {
                document.getElementById('context-loading-indicator').style.display = 'block';
                document.getElementById('context-content').style.display = 'none';

                try {
                    // Load context metrics
                    const contextResponse = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', `/api/admin/context-metrics?days=${currentDateRange}`, true);
                        xhr.withCredentials = true;
                        xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                                if (xhr.status === 200) {
                                    resolve(JSON.parse(xhr.responseText));
                                } else {
                                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                                }
                            }
                        };
                        xhr.send();
                    });
                    
                    // Update context table and heatmap
                    updateContextTable(contextResponse);
                    updateContextHeatmap(contextResponse);
                    updateSuggestions(contextResponse);
                    
                    document.getElementById('context-loading-indicator').style.display = 'none';
                    document.getElementById('context-content').style.display = 'block';
                    
                } catch (error) {
                    console.error('Error loading context data:', error);
                    document.getElementById('context-loading-indicator').innerHTML = '<div class="text-red-600">コンテキストデータの読み込みに失敗しました: ' + error.message + '</div>';
                }
            }

            function updateContextTable(contextData) {
                const tableBody = document.getElementById('context-table-body');
                const contextMap = {
                    '時短': 'quick',
                    'イベント': 'event', 
                    '健康': 'health',
                    '初心者': 'beginner'
                };

                let tableHTML = '';
                
                Object.keys(contextData).forEach(context => {
                    const data = contextData[context];
                    const englishContext = contextMap[context] || context;
                    
                    // Status based on thresholds
                    let status = '正常';
                    let statusClass = 'bg-green-100 text-green-800';
                    
                    if (data.ctr < 45 || data.ideal_match_rate < 50) {
                        status = '要改善';
                        statusClass = 'bg-red-100 text-red-800';
                    } else if (data.ctr < 50 || data.ideal_match_rate < 60) {
                        status = '注意';
                        statusClass = 'bg-yellow-100 text-yellow-800';
                    }
                    
                    tableHTML += `
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${context}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${data.total_sessions.toLocaleString()}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span class="${data.ctr < 45 ? 'text-red-600 font-semibold' : data.ctr >= 50 ? 'text-green-600' : 'text-yellow-600'}">${data.ctr}%</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span class="${data.ideal_match_rate < 50 ? 'text-red-600 font-semibold' : data.ideal_match_rate >= 60 ? 'text-green-600' : 'text-yellow-600'}">${data.ideal_match_rate}%</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${data.not_found_rate}%</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${data.allergen_rate}%</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                                    ${status}
                                </span>
                            </td>
                        </tr>
                    `;
                });
                
                tableBody.innerHTML = tableHTML;
            }

            function updateContextHeatmap(contextData) {
                const contextMap = {
                    '時短': 'quick',
                    'イベント': 'event', 
                    '健康': 'health',
                    '初心者': 'beginner'
                };

                Object.keys(contextData).forEach(context => {
                    const data = contextData[context];
                    const englishContext = contextMap[context];
                    const heatmapCell = document.getElementById(`context-heatmap-${englishContext}`);
                    
                    if (heatmapCell) {
                        const ctrValue = heatmapCell.querySelector('.text-2xl');
                        ctrValue.textContent = `${data.ctr}%`;
                        
                        // Color coding based on CTR
                        heatmapCell.className = 'context-heatmap-cell p-4 rounded-lg border-2 text-center ';
                        if (data.ctr >= 50) {
                            heatmapCell.className += 'bg-green-50 border-green-200 text-green-900';
                        } else if (data.ctr >= 45) {
                            heatmapCell.className += 'bg-yellow-50 border-yellow-200 text-yellow-900';
                        } else {
                            heatmapCell.className += 'bg-red-50 border-red-200 text-red-900';
                        }
                    }
                });
            }

            function updateSuggestions(contextData) {
                const suggestionsList = document.getElementById('suggestions-list');
                const suggestionsPanel = document.getElementById('suggestions-panel');
                
                let allSuggestions = [];
                
                Object.keys(contextData).forEach(context => {
                    const data = contextData[context];
                    if (data.suggestions && data.suggestions.length > 0) {
                        allSuggestions = allSuggestions.concat(data.suggestions);
                    }
                });
                
                if (allSuggestions.length > 0) {
                    let suggestionsHTML = '';
                    allSuggestions.forEach(suggestion => {
                        const iconClass = suggestion.type === 'ctr_low' ? '📈' : '💡';
                        suggestionsHTML += `
                            <div class="flex items-start space-x-3 p-3 bg-white rounded border-l-4 ${suggestion.type === 'ctr_low' ? 'border-blue-400' : 'border-orange-400'}">
                                <div class="text-xl">${iconClass}</div>
                                <div class="flex-1">
                                    <p class="text-sm text-gray-700">${suggestion.message}</p>
                                    <p class="text-xs text-gray-500 mt-1">アクション: ${suggestion.action}</p>
                                </div>
                            </div>
                        `;
                    });
                    suggestionsList.innerHTML = suggestionsHTML;
                    suggestionsPanel.style.display = 'block';
                } else {
                    suggestionsPanel.style.display = 'none';
                }
            }

            function initializeTrendCharts(trends) {
                const labels = trends.map(d => d.date);
                const top3CtrData = trends.map(d => d.top3_ctr);
                const shortDwellData = trends.map(d => d.short_dwell_rate);

                // Destroy existing charts
                if (chartInstances.top3Ctr) chartInstances.top3Ctr.destroy();
                if (chartInstances.shortDwell) chartInstances.shortDwell.destroy();

                // Top3 CTR Chart
                const top3CtrCtx = document.getElementById('top3CtrChart');
                chartInstances.top3Ctr = new Chart(top3CtrCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Top3 CTR (%)',
                            data: top3CtrData,
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.1,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: false
                            },
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'CTR (%)'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: '日付'
                                }
                            }
                        }
                    }
                });

                // Short Dwell Chart
                const shortDwellCtx = document.getElementById('shortDwellChart');
                chartInstances.shortDwell = new Chart(shortDwellCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: '短滞在率 (%)',
                            data: shortDwellData,
                            borderColor: 'rgb(249, 115, 22)',
                            backgroundColor: 'rgba(249, 115, 22, 0.1)',
                            tension: 0.1,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: {
                                display: false
                            },
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: '短滞在率 (%)'
                                }
                            },
                            x: {
                                title: {
                                    display: true,
                                    text: '日付'
                                }
                            }
                        }
                    }
                });
            }

            // Initialize on page load
            document.addEventListener('DOMContentLoaded', function() {
                loadOverviewData();
            });
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)