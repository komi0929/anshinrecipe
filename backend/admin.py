import os
import base64
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets

admin_router = APIRouter()
security = HTTPBasic()

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
                            <p class="text-gray-600">全体的なシステム概要とメトリクス</p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <!-- KPI Cards -->
                            <div class="bg-white p-6 rounded-lg shadow">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="text-sm font-medium text-gray-600">総検索数</p>
                                        <p class="text-2xl font-bold text-gray-900">-</p>
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
                                        <p class="text-2xl font-bold text-gray-900">-</p>
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
                                        <p class="text-2xl font-bold text-gray-900">-%</p>
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
                                        <p class="text-2xl font-bold text-gray-900">-ms</p>
                                    </div>
                                    <div class="p-3 bg-purple-50 rounded-full">
                                        <div class="w-6 h-6 text-purple-600">⚡</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Charts Row -->
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div class="bg-white p-6 rounded-lg shadow">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">検索トレンド</h3>
                                <canvas id="searchTrendChart" width="400" height="200"></canvas>
                            </div>

                            <div class="bg-white p-6 rounded-lg shadow">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">ユーザー分布</h3>
                                <canvas id="userDistributionChart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Context Section -->
                    <div id="context-section" class="content-section hidden">
                        <div class="mb-8">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">Context Analysis</h2>
                            <p class="text-gray-600">コンテキスト選択の分析とパフォーマンス</p>
                        </div>

                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div class="bg-white p-6 rounded-lg shadow">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">コンテキスト分布</h3>
                                <div class="space-y-4">
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-600">時短</span>
                                        <span class="text-sm font-medium">-%</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-600">イベント</span>
                                        <span class="text-sm font-medium">-%</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-600">健康</span>
                                        <span class="text-sm font-medium">-%</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-600">初心者</span>
                                        <span class="text-sm font-medium">-%</span>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-white p-6 rounded-lg shadow">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">コンテキスト成功率</h3>
                                <canvas id="contextSuccessChart" width="400" height="300"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Quality Section -->
                    <div id="quality-section" class="content-section hidden">
                        <div class="mb-8">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">Quality Metrics</h2>
                            <p class="text-gray-600">あんしんスコアと品質指標の分析</p>
                        </div>

                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div class="bg-white p-6 rounded-lg shadow">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">スコア分布</h3>
                                <div class="text-center">
                                    <div class="text-3xl font-bold text-green-600">-</div>
                                    <div class="text-sm text-gray-600 mt-2">平均あんしんスコア</div>
                                </div>
                            </div>

                            <div class="bg-white p-6 rounded-lg shadow">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">品質トレンド</h3>
                                <canvas id="qualityTrendChart" width="300" height="200"></canvas>
                            </div>

                            <div class="bg-white p-6 rounded-lg shadow">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">フィードバック</h3>
                                <div class="space-y-3">
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-600">出会えた</span>
                                        <span class="text-sm font-medium text-green-600">-%</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-600">出会えなかった</span>
                                        <span class="text-sm font-medium text-yellow-600">-%</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-sm text-gray-600">アレルゲン含有</span>
                                        <span class="text-sm font-medium text-red-600">-%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Funnel Section -->
                    <div id="funnel-section" class="content-section hidden">
                        <div class="mb-8">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">User Funnel</h2>
                            <p class="text-gray-600">ユーザーの行動フローとコンバージョン分析</p>
                        </div>

                        <div class="bg-white p-6 rounded-lg shadow">
                            <h3 class="text-lg font-semibold text-gray-900 mb-6">検索フロー</h3>
                            <div class="space-y-6">
                                <div class="flex items-center">
                                    <div class="flex-1 bg-blue-200 h-8 rounded-l-lg flex items-center px-4">
                                        <span class="text-sm font-medium">ページ訪問</span>
                                    </div>
                                    <div class="px-4 py-2 bg-blue-100 text-sm font-medium">100%</div>
                                </div>
                                <div class="flex items-center">
                                    <div class="flex-1 bg-green-200 h-8 flex items-center px-4" style="width: 80%">
                                        <span class="text-sm font-medium">検索実行</span>
                                    </div>
                                    <div class="px-4 py-2 bg-green-100 text-sm font-medium">-%</div>
                                </div>
                                <div class="flex items-center">
                                    <div class="flex-1 bg-yellow-200 h-8 flex items-center px-4" style="width: 60%">
                                        <span class="text-sm font-medium">結果閲覧</span>
                                    </div>
                                    <div class="px-4 py-2 bg-yellow-100 text-sm font-medium">-%</div>
                                </div>
                                <div class="flex items-center">
                                    <div class="flex-1 bg-purple-200 h-8 rounded-r-lg flex items-center px-4" style="width: 40%">
                                        <span class="text-sm font-medium">レシピクリック</span>
                                    </div>
                                    <div class="px-4 py-2 bg-purple-100 text-sm font-medium">-%</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Extract Section -->
                    <div id="extract-section" class="content-section hidden">
                        <div class="mb-8">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">Data Extract</h2>
                            <p class="text-gray-600">データエクスポートと分析ツール</p>
                        </div>

                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div class="bg-white p-6 rounded-lg shadow">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">エクスポート</h3>
                                <div class="space-y-4">
                                    <button class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                        検索ログをエクスポート
                                    </button>
                                    <button class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        フィードバックをエクスポート
                                    </button>
                                    <button class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                                        ユーザー行動をエクスポート
                                    </button>
                                </div>
                            </div>

                            <div class="bg-white p-6 rounded-lg shadow">
                                <h3 class="text-lg font-semibold text-gray-900 mb-4">データサマリー</h3>
                                <div class="space-y-3">
                                    <div class="flex justify-between">
                                        <span class="text-sm text-gray-600">総レコード数</span>
                                        <span class="text-sm font-medium">-</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-sm text-gray-600">最新更新</span>
                                        <span class="text-sm font-medium">-</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-sm text-gray-600">データサイズ</span>
                                        <span class="text-sm font-medium">- MB</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Domains Section -->
                    <div id="domains-section" class="content-section hidden">
                        <div class="mb-8">
                            <h2 class="text-2xl font-bold text-gray-900 mb-2">Domain Analysis</h2>
                            <p class="text-gray-600">レシピソースドメインのパフォーマンス分析</p>
                        </div>

                        <div class="bg-white rounded-lg shadow">
                            <div class="px-6 py-4 border-b">
                                <h3 class="text-lg font-semibold text-gray-900">ドメイン別統計</h3>
                            </div>
                            <div class="p-6">
                                <div class="overflow-x-auto">
                                    <table class="min-w-full">
                                        <thead>
                                            <tr class="border-b">
                                                <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">ドメイン</th>
                                                <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">表示回数</th>
                                                <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">クリック率</th>
                                                <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">平均スコア</th>
                                                <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">ステータス</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr class="border-b">
                                                <td class="py-3 px-4 text-sm">cookpad.com</td>
                                                <td class="py-3 px-4 text-sm">-</td>
                                                <td class="py-3 px-4 text-sm">-%</td>
                                                <td class="py-3 px-4 text-sm">-</td>
                                                <td class="py-3 px-4"><span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">アクティブ</span></td>
                                            </tr>
                                            <tr class="border-b">
                                                <td class="py-3 px-4 text-sm">kurashiru.com</td>
                                                <td class="py-3 px-4 text-sm">-</td>
                                                <td class="py-3 px-4 text-sm">-%</td>
                                                <td class="py-3 px-4 text-sm">-</td>
                                                <td class="py-3 px-4"><span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">アクティブ</span></td>
                                            </tr>
                                            <tr class="border-b">
                                                <td class="py-3 px-4 text-sm">recipe.rakuten.co.jp</td>
                                                <td class="py-3 px-4 text-sm">-</td>
                                                <td class="py-3 px-4 text-sm">-%</td>
                                                <td class="py-3 px-4 text-sm">-</td>
                                                <td class="py-3 px-4"><span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">アクティブ</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
            let currentSection = 'overview';
            let currentDateRange = 7;

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
                initializeCharts();
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
                
                // Refresh data (placeholder)
                console.log('Date range changed to:', days, 'days');
            }

            function initializeCharts() {
                // Initialize charts based on current section
                if (currentSection === 'overview') {
                    initSearchTrendChart();
                    initUserDistributionChart();
                } else if (currentSection === 'context') {
                    initContextSuccessChart();
                } else if (currentSection === 'quality') {
                    initQualityTrendChart();
                }
            }

            function initSearchTrendChart() {
                const ctx = document.getElementById('searchTrendChart');
                if (ctx) {
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: ['', '', '', '', '', '', ''],
                            datasets: [{
                                label: '検索数',
                                data: [0, 0, 0, 0, 0, 0, 0],
                                borderColor: 'rgb(59, 130, 246)',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                tension: 0.1
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }
                    });
                }
            }

            function initUserDistributionChart() {
                const ctx = document.getElementById('userDistributionChart');
                if (ctx) {
                    new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: ['新規', 'リピーター'],
                            datasets: [{
                                data: [0, 0],
                                backgroundColor: ['#10B981', '#6B7280']
                            }]
                        },
                        options: {
                            responsive: true
                        }
                    });
                }
            }

            function initContextSuccessChart() {
                const ctx = document.getElementById('contextSuccessChart');
                if (ctx) {
                    new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: ['時短', 'イベント', '健康', '初心者'],
                            datasets: [{
                                label: '成功率 (%)',
                                data: [0, 0, 0, 0],
                                backgroundColor: '#10B981'
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    max: 100
                                }
                            }
                        }
                    });
                }
            }

            function initQualityTrendChart() {
                const ctx = document.getElementById('qualityTrendChart');
                if (ctx) {
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: ['', '', '', '', '', '', ''],
                            datasets: [{
                                label: '平均スコア',
                                data: [0, 0, 0, 0, 0, 0, 0],
                                borderColor: '#10B981',
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                tension: 0.1
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    max: 100
                                }
                            }
                        }
                    });
                }
            }

            // Initialize on page load
            document.addEventListener('DOMContentLoaded', function() {
                initializeCharts();
            });
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)