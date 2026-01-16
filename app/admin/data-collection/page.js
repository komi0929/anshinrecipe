'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Play, Database, CheckCircle, AlertCircle, Loader2, ArrowRight, FileText, Globe, Instagram, Star, Edit3, Phone, CheckSquare, Square, ShieldCheck, Eye, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { CandidateInspectionModal } from '@/components/admin/CandidateInspectionModal';

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
    const [inspectingCandidate, setInspectingCandidate] = useState(null); // Modal State
    const [showOnlyAllergyRelevant, setShowOnlyAllergyRelevant] = useState(true);

    // All 47 prefectures of Japan
    const ALL_PREFECTURES = [
        '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
        '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
        '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
        '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
        '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
    ];

    // Municipality input - user types freely or selects from suggestions
    const [municipalityInput, setMunicipalityInput] = useState('');

    // Common municipalities for quick selection (major cities)
    const MAJOR_CITIES = {
        '北海道': ['札幌市', '函館市', '旭川市', '小樽市'],
        '宮城県': ['仙台市青葉区', '仙台市宮城野区', '仙台市太白区'],
        '埼玉県': ['さいたま市大宮区', 'さいたま市浦和区', '川越市', '越谷市'],
        '千葉県': ['千葉市中央区', '船橋市', '柏市', '松戸市'],
        '東京都': ['千代田区', '中央区', '港区', '新宿区', '渋谷区', '豊島区', '世田谷区', '品川区', '目黒区', '大田区', '杉並区', '練馬区', '足立区', '江戸川区', '葛飾区', '板橋区', '中野区', '北区', '荒川区', '台東区', '墨田区', '江東区', '文京区', '八王子市', '町田市', '立川市', '武蔵野市', '三鷹市'],
        '神奈川県': ['横浜市中区', '横浜市西区', '横浜市神奈川区', '川崎市川崎区', '川崎市中原区', '相模原市', '藤沢市', '横須賀市'],
        '愛知県': ['名古屋市中区', '名古屋市中村区', '名古屋市東区', '名古屋市千種区', '名古屋市昭和区', '名古屋市瑞穂区', '豊田市', '岡崎市'],
        '京都府': ['京都市中京区', '京都市下京区', '京都市東山区', '京都市左京区', '京都市北区', '京都市上京区'],
        '大阪府': ['大阪市北区', '大阪市中央区', '大阪市浪速区', '大阪市天王寺区', '大阪市西区', '大阪市福島区', '堺市', '東大阪市', '豊中市', '吹田市'],
        '兵庫県': ['神戸市中央区', '神戸市東灘区', '神戸市灘区', '姫路市', '西宮市', '尼崎市'],
        '広島県': ['広島市中区', '広島市南区', '広島市西区', '福山市', '呉市'],
        '福岡県': ['福岡市中央区', '福岡市博多区', '福岡市東区', '福岡市南区', '福岡市西区', '福岡市城南区', '福岡市早良区', '北九州市小倉北区', '北九州市小倉南区', '北九州市八幡東区', '北九州市八幡西区', '久留米市', '飯塚市', '大牟田市'],
        '沖縄県': ['那覇市', '浦添市', '宜野湾市', '沖縄市', '名護市']
    };

    // Update municipality suggestions when prefecture changes
    const municipalitySuggestions = MAJOR_CITIES[selectedPrefecture] || [];

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
                                {ALL_PREFECTURES.map(pref => (
                                    <option key={pref} value={pref}>{pref}</option>
                                ))}
                            </select>
                        </div>

                        {/* Municipality */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">市区町村（任意）</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    list="municipality-suggestions"
                                    value={selectedMunicipality}
                                    onChange={(e) => setSelectedMunicipality(e.target.value)}
                                    placeholder="例: 渋谷区"
                                    className="w-full h-12 rounded-xl border-slate-200 bg-slate-50 font-bold px-4 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                />
                                <datalist id="municipality-suggestions">
                                    <option value="全域（県単位）" />
                                    {municipalitySuggestions.map(m => (
                                        <option key={m} value={m} />
                                    ))}
                                </datalist>
                            </div>
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
                        {/* Filter Toggle */}
                        <div className="flex justify-end items-center gap-2 mb-2">
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={showOnlyAllergyRelevant}
                                    onChange={(e) => setShowOnlyAllergyRelevant(e.target.checked)}
                                    className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                                />
                                <span className="text-sm font-bold text-slate-700">アレルギー情報ありのみ表示</span>
                            </label>
                        </div>

                        {(() => {
                            // Filter logic
                            const validCandidates = candidates.filter(c => {
                                if (!showOnlyAllergyRelevant) return true;
                                // Check if has allergy info (removable or contained) or reliable source
                                const hasMenuAllergies = c.menus?.some(m =>
                                    (m.allergens_contained && m.allergens_contained.length > 0) ||
                                    (m.allergens_removable && m.allergens_removable.length > 0) ||
                                    (m.supportedAllergens && m.supportedAllergens.length > 0)
                                );
                                const hasFeatures = c.features?.allergy && Object.values(c.features.allergy).some(v => v);
                                return hasMenuAllergies || hasFeatures;
                            });

                            if (validCandidates.length === 0) {
                                return (
                                    <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border-2 border-dashed border-slate-100">
                                        {candidates.length > 0 ? '条件に一致する候補はありません（全表示に切り替えてみてください）' : '承認待ちのデータはありません。'}
                                    </div>
                                );
                            }

                            return validCandidates.map((shop, i) => (
                                <CandidateCard
                                    key={shop.id || i}
                                    data={shop}
                                    onInspect={() => setInspectingCandidate(shop)}
                                // onApprove/Reject handles are now passed to modal, but we keep them here if needed for inline actions (optional)
                                />
                            ));
                        })()}
                    </div>
                )}

                {/* INSPECTION MODAL */}
                <CandidateInspectionModal
                    candidate={inspectingCandidate}
                    isOpen={!!inspectingCandidate}
                    onClose={() => setInspectingCandidate(null)}
                    onApprove={async (options) => {
                        await approveCandidate(inspectingCandidate.id, { ...options, shopName: inspectingCandidate.shopName });
                        setInspectingCandidate(null);
                    }}
                    onReject={async () => {
                        await rejectCandidate(inspectingCandidate.id);
                        setInspectingCandidate(null);
                    }}
                />

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


function CandidateCard({ data, onInspect }) {
    const isReliable = data.finalReliabilityScore >= 70;
    const meta = data.sources?.find(s => s.type === 'system_metadata')?.data || {};
    const images = meta.images || [];
    const mainImage = images.length > 0 ? images[0].url : null;
    const menuCount = data.menus?.length || 0;

    // Check allergy status
    const hasAllergyInfo = data.menus?.some(m => m.allergens_contained?.length > 0 || m.allergens_removable?.length > 0);

    return (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex items-start gap-4">
            {/* Thumbnail */}
            <div className="w-24 h-24 shrink-0 rounded-lg bg-slate-100 overflow-hidden relative">
                {mainImage ? (
                    <img src={mainImage} className="w-full h-full object-cover" alt={data.shopName} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <MapPin size={24} />
                    </div>
                )}
                {data.isUpdate && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                        更新あり
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-800 text-lg truncate">{data.shopName}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${isReliable ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                        信頼度: {data.finalReliabilityScore}
                    </span>
                </div>

                <div className="text-xs text-slate-500 mb-2 truncate">{data.address}</div>

                {/* Badge Row */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {hasAllergyInfo && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 flex items-center gap-1">
                            <ShieldCheck size={10} /> アレルギー情報あり
                        </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        メニュー {menuCount}件
                    </span>
                    {data.instagram_url && (
                        <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-100 flex items-center gap-1">
                            <Instagram size={10} /> Insta
                        </span>
                    )}
                </div>

                {/* Action */}
                <Button
                    onClick={onInspect}
                    size="sm"
                    className="w-full sm:w-auto bg-slate-800 hover:bg-slate-900 text-white shadow-lg shadow-slate-200"
                >
                    <Search size={14} className="mr-2" />
                    詳細を確認して承認・修正
                </Button>
            </div>
        </div>
    );
}
