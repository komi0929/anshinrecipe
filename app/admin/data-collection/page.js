'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Play, Database, CheckCircle, AlertCircle, Loader2, ArrowRight, FileText, Globe, Instagram, Star, Edit3, Phone, CheckSquare, Square, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';

export default function DataCollectionAdminPage() {
    const [selectedPrefecture, setSelectedPrefecture] = useState('福岡県');
    const [selectedMunicipality, setSelectedMunicipality] = useState('');
    const [municipalities, setMunicipalities] = useState([]);
    const [collectionHistory, setCollectionHistory] = useState([]);
    const [isCollecting, setIsCollecting] = useState(false);
    const [status, setStatus] = useState('idle');
    const [logs, setLogs] = useState([]);

    // Workflow State
    const [activeTab, setActiveTab] = useState('inbox'); // 'inbox', 'live', 'reports'
    const [candidates, setCandidates] = useState([]);
    const [liveData, setLiveData] = useState([]);
    const [reports, setReports] = useState([]);
    const [editingItem, setEditingItem] = useState(null);

    // Prefecture to Municipality mapping
    const PREFECTURE_MUNICIPALITIES = {
        '福岡県': [
            { code: '40130', name: '福岡市中央区' },
            { code: '40131', name: '福岡市博多区' },
            { code: '40132', name: '福岡市東区' },
            { code: '40133', name: '福岡市南区' },
            { code: '40134', name: '福岡市西区' },
            { code: '40135', name: '福岡市城南区' },
            { code: '40136', name: '福岡市早良区' },
            { code: '40202', name: '北九州市小倉北区' },
            { code: '40203', name: '北九州市小倉南区' },
            { code: '40204', name: '北九州市八幡東区' },
            { code: '40205', name: '北九州市八幡西区' },
            { code: '40206', name: '北九州市戸畑区' },
            { code: '40207', name: '北九州市門司区' },
            { code: '40208', name: '北九州市若松区' },
            { code: '40230', name: '久留米市' },
        ],
        '東京都': [
            { code: '13101', name: '千代田区' },
            { code: '13102', name: '中央区' },
            { code: '13103', name: '港区' },
            { code: '13104', name: '新宿区' },
            { code: '13105', name: '文京区' },
            { code: '13106', name: '台東区' },
            { code: '13107', name: '墨田区' },
            { code: '13108', name: '江東区' },
            { code: '13109', name: '品川区' },
            { code: '13110', name: '目黒区' },
            { code: '13111', name: '大田区' },
            { code: '13112', name: '世田谷区' },
            { code: '13113', name: '渋谷区' },
            { code: '13114', name: '中野区' },
            { code: '13115', name: '杉並区' },
            { code: '13116', name: '豊島区' },
            { code: '13117', name: '北区' },
            { code: '13118', name: '荒川区' },
            { code: '13119', name: '板橋区' },
            { code: '13120', name: '練馬区' },
            { code: '13121', name: '足立区' },
            { code: '13122', name: '葛飾区' },
            { code: '13123', name: '江戸川区' },
        ],
        '大阪府': [
            { code: '27102', name: '大阪市北区' },
            { code: '27103', name: '大阪市都島区' },
            { code: '27104', name: '大阪市福島区' },
            { code: '27106', name: '大阪市中央区' },
            { code: '27107', name: '大阪市西区' },
            { code: '27108', name: '大阪市港区' },
            { code: '27109', name: '大阪市大正区' },
            { code: '27111', name: '大阪市浪速区' },
            { code: '27113', name: '大阪市天王寺区' },
            { code: '27119', name: '梅田・難波エリア' },
        ],
    };

    // Update municipalities when prefecture changes
    useEffect(() => {
        setMunicipalities(PREFECTURE_MUNICIPALITIES[selectedPrefecture] || []);
        setSelectedMunicipality('');
    }, [selectedPrefecture]);

    // Fetch collection history
    useEffect(() => {
        fetchCollectionHistory();
    }, []);

    const fetchCollectionHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('data_collection_jobs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            if (!error) setCollectionHistory(data || []);
        } catch (e) {
            console.error('Fetch history error:', e);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchCandidates();
        fetchLiveRestaurants();
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const { data, error } = await supabase
                .from('restaurant_reports')
                .select('*, restaurants(name)')
                .order('created_at', { ascending: false });
            if (!error) setReports(data);
        } catch (e) {
            console.error('Fetch reports error:', e);
        }
    };

    const fetchCandidates = async () => {
        try {
            const res = await fetch('/api/admin/candidates');
            const data = await res.json();
            if (data.success) {
                const mapped = data.data.map(c => ({
                    id: c.id,
                    shopName: c.shop_name,
                    address: c.address,
                    phone: c.phone,
                    website_url: c.website_url,
                    instagram_url: c.instagram_url,
                    lat: c.lat,
                    lng: c.lng,
                    menus: c.menus,
                    sources: c.sources,
                    finalReliabilityScore: c.reliability_score
                }));
                setCandidates(mapped);
            }
        } catch (error) {
            console.error('Fetch candidates error:', error);
            setLogs(prev => [...prev, `[ERROR] 候補データ取得中にエラーが発生しました: ${error.message}`]);
        }
    };

    const fetchLiveRestaurants = async () => {
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select('*, menus(*)')
                .order('created_at', { ascending: false });
            if (!error) setLiveData(data);
        } catch (e) {
            console.error('Fetch live restaurants error:', e);
            setLogs(prev => [...prev, `[ERROR] 本番データ取得中にエラーが発生しました: ${e.message}`]);
        }
    };

    const handleStartCollection = async () => {
        const area = selectedMunicipality || selectedPrefecture;
        setIsCollecting(true);
        setStatus('processing');
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 処理を開始しました: ${area}`]);
        setActiveTab('inbox');

        try {
            const response = await fetch('/api/admin/collect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    area: area,
                    municipalityCode: selectedMunicipality ? municipalities.find(m => m.name === selectedMunicipality)?.code : null
                })
            });

            const data = await response.json();

            if (data.success) {
                await fetchCandidates();
                await fetchCollectionHistory(); // Refresh history
                setStatus('complete');
                setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 収集・保存完了。承認待ちボックスを確認してください。`]);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
            setLogs(prev => [...prev, `[ERROR] 処理中にエラーが発生しました: ${error.message}`]);
        } finally {
            setIsCollecting(false);
        }
    };

    const approveCandidate = async (candidateId, options = {}) => {
        try {
            const res = await fetch('/api/admin/candidates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId,
                    selectedMenuIndices: options.selectedMenuIndices,
                    selectedImage: options.selectedImage,
                    editedCandidates: options.editedCandidates
                })
            });
            const data = await res.json();
            if (data.success) {
                setLogs(prev => [...prev, `[承認] ${options.shopName || '店舗'} を本番登録しました`]);
                await fetchCandidates();
                await fetchLiveRestaurants();
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            console.error('Approve candidate error:', e);
            setLogs(prev => [...prev, `[ERROR] 承認処理中にエラーが発生しました: ${e.message}`]);
        }
    };

    const rejectCandidate = async (candidateId) => {
        try {
            const res = await fetch('/api/admin/candidates/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateId })
            });
            const data = await res.json();
            if (data.success) {
                setLogs(prev => [...prev, `[却下] 候補を却下しました`]);
                await fetchCandidates();
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            console.error('Reject candidate error:', e);
            setLogs(prev => [...prev, `[ERROR] 却下処理中にエラーが発生しました: ${e.message}`]);
        }
    };

    const deleteLiveData = async (id) => {
        if (confirm('本番データを削除しますか？')) {
            try {
                const res = await fetch('/api/restaurants', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });
                const data = await res.json();
                if (data.success) {
                    setLogs(prev => [...prev, `[削除] データを削除しました`]);
                    await fetchLiveRestaurants();
                } else {
                    throw new Error(data.error);
                }
            } catch (e) {
                console.error('Delete live data error:', e);
                setLogs(prev => [...prev, `[ERROR] 本番データ削除中にエラーが発生しました: ${e.message}`]);
            }
        }
    };

    // Format relative time
    const formatRelativeTime = (dateString) => {
        if (!dateString) return '未収集';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffDays > 30) return `${Math.floor(diffDays / 30)}ヶ月前`;
        if (diffDays > 0) return `${diffDays}日前`;
        if (diffHours > 0) return `${diffHours}時間前`;
        return '直近';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 mb-1">データ収集コンソール</h1>
                        <p className="text-slate-500 text-sm">市町村単位でデータを収集し、承認して本番反映します</p>
                    </div>
                </div>

                {/* NEW: Area Selection with Municipality */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        {/* Prefecture */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">都道府県</label>
                            <select
                                value={selectedPrefecture}
                                onChange={(e) => setSelectedPrefecture(e.target.value)}
                                className="w-full h-12 rounded-xl border-slate-200 bg-slate-50 font-bold px-4 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                            >
                                <option value="福岡県">福岡県</option>
                                <option value="東京都">東京都</option>
                                <option value="大阪府">大阪府</option>
                            </select>
                        </div>

                        {/* Municipality */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">市区町村（任意）</label>
                            <select
                                value={selectedMunicipality}
                                onChange={(e) => setSelectedMunicipality(e.target.value)}
                                className="w-full h-12 rounded-xl border-slate-200 bg-slate-50 font-bold px-4 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                            >
                                <option value="">全域（県単位）</option>
                                {municipalities.map(m => (
                                    <option key={m.code} value={m.name}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Collect Button */}
                        <div>
                            <Button
                                onClick={handleStartCollection}
                                disabled={isCollecting}
                                className="w-full h-12"
                            >
                                {isCollecting ? (
                                    <><Loader2 className="animate-spin mr-2" size={18} /> 収集中...</>
                                ) : (
                                    <><Play className="fill-current mr-2" size={18} /> 収集開始</>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Status Log */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <span className="text-xs font-mono text-slate-400">
                            {logs.length > 0 ? logs[logs.length - 1] : '準備完了'}
                        </span>
                    </div>
                </div>

                {/* NEW: Collection History */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Database size={16} className="text-orange-500" />
                        収集履歴
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs">エリア</th>
                                    <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs">収集日時</th>
                                    <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs">経過</th>
                                    <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs">ステータス</th>
                                    <th className="text-left py-2 px-3 font-bold text-slate-500 text-xs">件数</th>
                                </tr>
                            </thead>
                            <tbody>
                                {collectionHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-slate-400">収集履歴がありません</td>
                                    </tr>
                                ) : (
                                    collectionHistory.slice(0, 10).map((job) => (
                                        <tr key={job.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-3 font-bold text-slate-800">{job.area}</td>
                                            <td className="py-3 px-3 text-slate-600">
                                                {new Date(job.created_at).toLocaleDateString('ja-JP', {
                                                    year: 'numeric', month: '2-digit', day: '2-digit',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${formatRelativeTime(job.created_at) === '直近' ? 'bg-green-100 text-green-700' :
                                                        formatRelativeTime(job.created_at).includes('日') ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {formatRelativeTime(job.created_at)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${job.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        job.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                            job.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                                'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {job.status === 'completed' ? '完了' :
                                                        job.status === 'processing' ? '処理中' :
                                                            job.status === 'failed' ? '失敗' : job.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-slate-600">{job.collected_count || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl w-fit">
                    <button onClick={() => setActiveTab('inbox')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inbox' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        承認待ち ({candidates.length})
                    </button>
                    <button onClick={() => setActiveTab('live')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'live' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        本番データ ({liveData.length})
                    </button>
                    <button onClick={() => setActiveTab('reports')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'reports' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}>
                        不備報告 ({reports.length})
                    </button>
                </div>

                {/* Content Area */}
                {activeTab === 'inbox' && (
                    <div className="space-y-4">
                        {candidates.length === 0 ? (
                            <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                                承認待ちのデータはありません。
                            </div>
                        ) : (
                            candidates.map((shop, i) => (
                                <CandidateCard
                                    key={shop.id || i}
                                    data={shop}
                                    onApprove={(options) => approveCandidate(shop.id, { ...options, shopName: shop.shopName })}
                                    onReject={() => rejectCandidate(shop.id)}
                                />
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'live' && (
                    <div className="space-y-4">
                        {liveData.length === 0 && <div className="text-center py-20 text-slate-400">本番データはありません</div>}
                        {liveData.map((shop, i) => (
                            <div key={shop.id || i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                                <div className="flex-1">
                                    <div className="font-bold text-slate-800">{shop.name}</div>
                                    <div className="text-xs text-slate-500">{shop.address}</div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => {
                                        const newVal = prompt('新しい店舗名を入力してください', shop.name);
                                        if (newVal) {
                                            fetch('/api/restaurants', {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ id: shop.id, name: newVal })
                                            }).then(() => fetchLiveRestaurants());
                                        }
                                    }} className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded hover:bg-slate-200 flex items-center gap-1">
                                        <Edit3 size={12} /> 編集
                                    </button>
                                    <button onClick={() => deleteLiveData(shop.id)} className="text-xs text-red-500 font-bold bg-red-50 px-3 py-1 rounded hover:bg-red-100">削除</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="space-y-4">
                        {reports.length === 0 && <div className="text-center py-20 text-slate-400">報告はありません</div>}
                        {reports.map((report) => (
                            <div key={report.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">{report.issue_type}</div>
                                        <h3 className="font-bold text-slate-800">{report.restaurants?.name}</h3>
                                    </div>
                                    <span className="text-[10px] text-slate-400">{new Date(report.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">{report.details}</p>
                                <div className="flex justify-end gap-2">
                                    <Button size="xs" variant="outline" onClick={async () => {
                                        await supabase.from('restaurant_reports').update({ status: 'resolved' }).eq('id', report.id);
                                        fetchReports();
                                    }}>解決済みにする</Button>
                                    <Button size="xs" onClick={() => setActiveTab('live')}>本番データを修正</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}


function CandidateCard({ data, onApprove, onReject }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isEnriching, setIsEnriching] = useState(false);

    // Standard Definitions
    const ALLERGEN_LABELS = { wheat: '小麦', egg: '卵', milk: '乳', buckwheat: 'そば', peanut: '落花生', shrimp: 'えび', crab: 'かに' };
    const ALLERGEN_KEYS = Object.keys(ALLERGEN_LABELS);

    const FEATURE_LABELS = {
        child: {
            kids_menu: 'お子様メニュー',
            kids_chair: 'キッズチェア',
            stroller_access: 'ベビーカー入店',
            diaper_change: 'おむつ交換台'
        },
        allergy: {
            allergen_table: 'アレルギー一覧表',
            staff_trained: 'スタッフ講習受講',
            kitchen_separation: '調理器具区分け',
            contamination_policy: 'コンタミ対策公開'
        }
    };

    const [editedData, setEditedData] = useState({
        shopName: data.shopName,
        address: data.address,
        phone: data.phone,
        website_url: data.website_url,
        instagram_url: data.instagram_url,
        menus: (data.menus || []).map(m => ({
            ...m,
            allergens_contained: m.allergens_contained || [],
            allergens_removable: m.allergens_removable || [],
            supportedAllergens: m.supportedAllergens || []
        })),
        features: data.features || { child: {}, allergy: {} },
        metadata: data.metadata || {} // New field for extended metadata (hours, parking, etc)
    });

    const [selectedMenus, setSelectedMenus] = useState(data.menus.map((_, i) => i));
    const [selectedImage, setSelectedImage] = useState(null);

    const updateFeature = (category, key) => {
        setEditedData(prev => {
            const currentVal = prev.features?.[category]?.[key];
            return {
                ...prev,
                features: {
                    ...prev.features,
                    [category]: {
                        ...(prev.features?.[category] || {}),
                        [key]: !currentVal
                    }
                }
            };
        });
    };

    // New: Handle Enrichment
    const handleEnrich = async () => {
        setIsEnriching(true);
        try {
            const res = await fetch('/api/admin/enrich', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateId: data.id,
                    shopName: editedData.shopName,
                    address: editedData.address
                })
            });
            const result = await res.json();
            if (result.success && result.verifiedData) {
                // Merge Data
                const enriched = result.verifiedData;
                setEditedData(prev => ({
                    ...prev,
                    features: {
                        ...prev.features,
                        parking: enriched.features.parking,
                        payment: enriched.features.payment,
                        accessibility: enriched.features.accessibility
                    },
                    metadata: {
                        ...prev.metadata,
                        opening_hours: enriched.metadata.opening_hours,
                        national_phone: enriched.metadata.phone
                    },
                    website_url: enriched.metadata.website_url || prev.website_url
                }));
                alert('詳細情報を取得・更新しました！');
            } else {
                alert('情報の取得に失敗しました: ' + (result.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert('エラーが発生しました');
        } finally {
            setIsEnriching(false);
        }
    };

    const isReliable = data.finalReliabilityScore >= 70;

    // Extract images from metadata
    const meta = data.sources?.find(s => s.type === 'system_metadata')?.data || {};
    const images = meta.images || [];

    const handleSaveEdits = async () => {
        try {
            const res = await fetch('/api/admin/candidates', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: data.id,
                    shop_name: editedData.shopName,
                    address: editedData.address,
                    phone: editedData.phone,
                    website_url: editedData.website_url,
                    instagram_url: editedData.instagram_url,
                    menus: editedData.menus,
                    features: editedData.features, // Save extended features
                    metadata: editedData.metadata
                })
            });
            if (res.ok) {
                setIsEditing(false);
            }
        } catch (e) {
            alert('保存に失敗しました');
        }
    };

    const addMenu = () => {
        setEditedData(prev => ({
            ...prev,
            menus: [...prev.menus, { name: '新メニュー', supportedAllergens: [], description: '', valueScore: 100 }]
        }));
        setSelectedMenus(prev => [...prev, editedData.menus.length]);
    };

    const removeMenu = (idx) => {
        setEditedData(prev => ({
            ...prev,
            menus: prev.menus.filter((_, i) => i !== idx)
        }));
        setSelectedMenus(prev => prev.filter(i => i !== idx));
    };

    const updateMenu = (idx, field, value) => {
        setEditedData(prev => {
            const newMenus = [...prev.menus];
            newMenus[idx] = { ...newMenus[idx], [field]: value };
            return { ...prev, menus: newMenus };
        });
    };

    const toggleMenuSelection = (idx) => {
        if (isEditing) return; // Disable selection while editing content
        setSelectedMenus(prev =>
            prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
        );
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 group hover:ring-2 hover:ring-primary/20 transition-all">
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 space-y-4">
                    {/* Header Section */}
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            {isEditing ? (
                                <input
                                    className="text-lg font-bold text-slate-900 w-full border-b border-primary outline-none"
                                    value={editedData.shopName}
                                    onChange={(e) => setEditedData({ ...editedData, shopName: e.target.value })}
                                />
                            ) : (
                                <h3 className="text-lg font-bold text-slate-900">{editedData.shopName}</h3>
                            )}
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                <MapPin size={12} className="text-orange-500" />
                                {isEditing ? (
                                    <input
                                        className="w-full border-b border-slate-200 outline-none"
                                        value={editedData.address}
                                        onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                                        placeholder="店舗住所"
                                    />
                                ) : (
                                    editedData.address || '住所未設定'
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                <Phone size={12} className="text-blue-500" />
                                {isEditing ? (
                                    <input
                                        className="w-full border-b border-slate-200 outline-none"
                                        value={editedData.phone || ''}
                                        onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                                        placeholder="電話番号"
                                    />
                                ) : (
                                    editedData.phone || meta.phone || '電話番号なし'
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                <Globe size={12} />
                                {isEditing ? (
                                    <input
                                        className="w-full border-b border-slate-200 outline-none"
                                        value={editedData.website_url || ''}
                                        onChange={(e) => setEditedData({ ...editedData, website_url: e.target.value })}
                                        placeholder="公式URL"
                                    />
                                ) : (
                                    editedData.website_url || meta.website_url || 'URLなし'
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-pink-500 mt-1">
                                <Instagram size={12} />
                                {isEditing ? (
                                    <input
                                        className="w-full border-b border-pink-200 outline-none text-pink-600"
                                        value={editedData.instagram_url || ''}
                                        onChange={(e) => setEditedData({ ...editedData, instagram_url: e.target.value })}
                                        placeholder="Instagram URL"
                                    />
                                ) : (
                                    editedData.instagram_url || 'SNS未登録'
                                )}
                            </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${isReliable ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                            信頼度: {data.finalReliabilityScore}
                        </span>
                    </div>

                    {/* Image Discovery Gallery */}
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex justify-between">
                            <span>掲載写真を選択</span>
                            {!images.length && <span className="text-yellow-500">候補写真なし (手動追加可)</span>}
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {/* Manual URL input in editing mode if no images or just because */}
                            {isEditing && (
                                <div className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center p-1">
                                    <input
                                        type="text"
                                        placeholder="URL貼付"
                                        className="w-full h-full text-[8px] outline-none bg-transparent text-center"
                                        value={selectedImage || ''}
                                        onChange={(e) => setSelectedImage(e.target.value)}
                                    />
                                </div>
                            )}
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedImage(img.url)}
                                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedImage === img.url ? 'border-primary ring-2 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={img.url} className="w-full h-full object-cover" alt="Candidate" />
                                    {selectedImage === img.url && (
                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                            <CheckCircle size={20} className="text-white fill-primary" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Menus Section */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">メニュー構成</div>
                            {isEditing && (
                                <button onClick={addMenu} className="text-[10px] font-bold text-primary hover:text-primary-dark">
                                    + メニューを追加
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {editedData.menus.map((menu, j) => (
                                <div key={j} className={`group/menu relative border rounded-xl p-3 transition-all ${selectedMenus.includes(j) ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-transparent opacity-40'}`}>
                                    <div className="flex items-start gap-3">
                                        {!isEditing && (
                                            <div
                                                onClick={() => toggleMenuSelection(j)}
                                                className={`mt-1 flex-shrink-0 w-4 h-4 rounded border cursor-pointer flex items-center justify-center ${selectedMenus.includes(j) ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-300'}`}
                                            >
                                                {selectedMenus.includes(j) && <CheckCircle size={10} />}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <div className="space-y-4 bg-white p-3 rounded-lg border border-slate-200">
                                                    <input
                                                        className="font-bold text-sm w-full outline-none border-b border-dotted mb-2"
                                                        value={menu.name}
                                                        onChange={(e) => updateMenu(j, 'name', e.target.value)}
                                                        placeholder="メニュー名"
                                                    />

                                                    {/* Granular Allergy Editor */}
                                                    <div>
                                                        <div className="text-[10px] font-bold text-slate-500 mb-1">アレルゲン情報 (7大)</div>
                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                            {ALLERGEN_KEYS.map(key => (
                                                                <div key={key} className="flex items-center justify-between text-xs border-b border-slate-50 pb-1">
                                                                    <span className="text-slate-600 w-12">{ALLERGEN_LABELS[key]}</span>
                                                                    <div className="flex gap-3">
                                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={menu.allergens_contained?.includes(key)}
                                                                                onChange={(e) => {
                                                                                    const isChecked = e.target.checked;
                                                                                    const current = menu.allergens_contained || [];
                                                                                    updateMenu(j, 'allergens_contained', isChecked ? [...current, key] : current.filter(k => k !== key));
                                                                                }}
                                                                                className="accent-rose-500"
                                                                            />
                                                                            <span className="text-[10px] text-rose-500">使用</span>
                                                                        </label>
                                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={menu.allergens_removable?.includes(key)}
                                                                                onChange={(e) => {
                                                                                    const isChecked = e.target.checked;
                                                                                    const current = menu.allergens_removable || [];
                                                                                    updateMenu(j, 'allergens_removable', isChecked ? [...current, key] : current.filter(k => k !== key));
                                                                                }}
                                                                                className="accent-blue-500"
                                                                            />
                                                                            <span className="text-[10px] text-blue-500">除去可</span>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <textarea
                                                        className="text-xs w-full outline-none text-slate-400 bg-slate-50 p-1 rounded"
                                                        value={menu.description}
                                                        onChange={(e) => updateMenu(j, 'description', e.target.value)}
                                                        placeholder="説明文"
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-bold text-sm">{menu.name}</span>
                                                        <div className="flex flex-col items-end gap-1">
                                                            {/* Display Granular Allergy Badges in Preview */}
                                                            <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                                                                {ALLERGEN_KEYS.map(key => {
                                                                    const isContained = menu.allergens_contained?.includes(key);
                                                                    const isRemovable = menu.allergens_removable?.includes(key);
                                                                    if (isContained) return (
                                                                        <span key={key} className="text-[9px] px-1 rounded bg-rose-50 text-rose-600 border border-rose-100 flex items-center">
                                                                            {ALLERGEN_LABELS[key]}含
                                                                        </span>
                                                                    );
                                                                    if (isRemovable) return (
                                                                        <span key={key} className="text-[9px] px-1 rounded bg-blue-50 text-blue-600 border border-blue-100 flex items-center">
                                                                            {ALLERGEN_LABELS[key]}除
                                                                        </span>
                                                                    );
                                                                    return null;
                                                                })}
                                                                {(!menu.allergens_contained?.length && !menu.allergens_removable?.length) &&
                                                                    <span className="text-[9px] text-slate-300">情報なし</span>
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{menu.description}</p>
                                                </>
                                            )}
                                        </div>
                                        {isEditing && (
                                            <button onClick={() => removeMenu(j)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                                <AlertCircle size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Standard Features Section (Both Edit and View) */}
                    <div className="mt-4 border-t border-slate-100 pt-3">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">施設・対応状況 (標準リスト)</div>
                        {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Child Support */}
                                <div>
                                    <div className="flex items-center gap-1 mb-1 text-xs font-bold text-orange-600">
                                        <CheckCircle size={10} /> 子ども対応
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(FEATURE_LABELS.child).map(([key, label]) => (
                                            <label key={key} className="flex items-center gap-1.5 cursor-pointer p-1.5 rounded-md hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-100">
                                                <input
                                                    type="checkbox"
                                                    checked={!!editedData.features?.child?.[key]}
                                                    onChange={() => updateFeature('child', key)}
                                                    className="w-3 h-3 accent-orange-500 rounded-sm"
                                                />
                                                <span className={`text-[10px] ${editedData.features?.child?.[key] ? 'text-orange-700 font-bold' : 'text-slate-500'}`}>{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                {/* Allergy Support */}
                                <div>
                                    <div className="flex items-center gap-1 mb-1 text-xs font-bold text-emerald-600">
                                        <ShieldCheck size={10} /> アレルギー対応
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(FEATURE_LABELS.allergy).map(([key, label]) => (
                                            <label key={key} className="flex items-center gap-1.5 cursor-pointer p-1.5 rounded-md hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100">
                                                <input
                                                    type="checkbox"
                                                    checked={!!editedData.features?.allergy?.[key]}
                                                    onChange={() => updateFeature('allergy', key)}
                                                    className="w-3 h-3 accent-emerald-500 rounded-sm"
                                                />
                                                <span className={`text-[10px] ${editedData.features?.allergy?.[key] ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Read-only View for Features
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center gap-1 mb-1 text-xs font-bold text-slate-400">子ども対応</div>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(FEATURE_LABELS.child).map(([key, label]) => {
                                            const isActive = !!editedData.features?.child?.[key];
                                            if (!isActive) return null;
                                            return (
                                                <span key={key} className="text-[9px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100 font-bold">
                                                    {label}
                                                </span>
                                            );
                                        })}
                                        {Object.keys(editedData.features?.child || {}).every(k => !editedData.features?.child?.[k]) && <span className="text-[9px] text-slate-300">情報なし</span>}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1 mb-1 text-xs font-bold text-slate-400">アレルギー対応</div>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(FEATURE_LABELS.allergy).map(([key, label]) => {
                                            const isActive = !!editedData.features?.allergy?.[key];
                                            if (!isActive) return null;
                                            return (
                                                <span key={key} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">
                                                    {label}
                                                </span>
                                            );
                                        })}
                                        {Object.keys(editedData.features?.allergy || {}).every(k => !editedData.features?.allergy?.[k]) && <span className="text-[9px] text-slate-300">情報なし</span>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Extended Metadata (Parking, Payments, etc) - Added for Verification Question */}
                    {(editedData.features?.parking || editedData.features?.payment || isEditing) && (
                        <div className="mt-4 border-t border-slate-100 pt-3">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">その他詳細情報 (Enrichment)</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs font-bold text-slate-600 mb-1">駐車場</div>
                                    <div className="flex gap-2">
                                        <label className="flex items-center gap-1 text-[10px] text-slate-600">
                                            <input type="checkbox" disabled={!isEditing} checked={!!editedData.features?.parking?.has_parking} onChange={() => { }} className="accent-slate-500" />
                                            有
                                        </label>
                                        {(editedData.features?.parking?.free_parking || isEditing) && <span className="text-[10px] text-slate-400">(無料: {editedData.features?.parking?.free_parking ? '○' : '-'})</span>}
                                        {(editedData.features?.parking?.paid_parking || isEditing) && <span className="text-[10px] text-slate-400">(有料: {editedData.features?.parking?.paid_parking ? '○' : '-'})</span>}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-600 mb-1">支払い</div>
                                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-600">
                                        {editedData.features?.payment?.credit_card ? 'クレカOK' : ''}
                                        {editedData.features?.payment?.cash_only ? '現金のみ' : ''}
                                        {!editedData.features?.payment && <span className="text-slate-300">-</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sources (Read Only) */}
                    <div className="pt-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">情報ソース</div>
                        <div className="flex flex-wrap gap-2">
                            {data.sources && data.sources.filter(s => s.type !== 'system_metadata').map((s, idx) => (
                                <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline bg-blue-50 px-2 py-0.5 rounded">
                                    {s.type}: {new URL(s.url).hostname}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {/* Actions */}
            <div className="flex flex-row md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                {!isEditing ? (
                    <>
                        <Button
                            onClick={() => onApprove({
                                selectedMenuIndices: selectedMenus,
                                selectedImage,
                                // Pass full edited data structure
                                editedCandidates: editedData
                            })}
                            size="sm"
                            disabled={selectedMenus.length === 0}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
                        >
                            <CheckCircle size={16} className="mr-1" /> 承認して登録
                        </Button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-full py-2 text-xs font-bold text-slate-500 hover:text-blue-500 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                            <Edit3 size={14} /> 内容を自由編集
                        </button>
                    </>
                ) : (
                    <div className="space-y-2">
                        <Button
                            onClick={handleSaveEdits}
                            size="sm"
                            className="w-full bg-blue-500 hover:bg-blue-600 shadow-blue-200"
                        >
                            保存して確定
                        </Button>

                        {/* ENRICH BUTTON (New Feature) */}
                        <Button
                            onClick={handleEnrich}
                            disabled={isEnriching}
                            size="sm"
                            variant="outline"
                            className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                        >
                            {isEnriching ? <Loader2 className="animate-spin mr-1" size={14} /> : <Database className="mr-1" size={14} />}
                            詳細情報を自動取得
                        </Button>
                    </div>
                )}
                <button onClick={onReject} className="w-full py-2 text-xs font-bold text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center gap-1">
                    <AlertCircle size={14} /> この候補を却下
                </button>
            </div>
        </div>
    );
}
