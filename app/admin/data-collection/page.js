'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Play, Database, CheckCircle, AlertCircle, Loader2, ArrowRight, FileText, Globe, Instagram, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function DataCollectionAdminPage() {
    const [selectedArea, setSelectedArea] = useState('福岡県');
    const [isCollecting, setIsCollecting] = useState(false);
    const [status, setStatus] = useState('idle');
    const [logs, setLogs] = useState([]);

    // Workflow State
    const [activeTab, setActiveTab] = useState('inbox'); // 'inbox', 'live'
    const [candidates, setCandidates] = useState([]);
    const [liveData, setLiveData] = useState([]);

    // Initial Load
    useEffect(() => {
        fetchCandidates();
        fetchLiveRestaurants();
    }, []);

    const fetchCandidates = async () => {
        try {
            const res = await fetch('/api/admin/candidates');
            const data = await res.json();
            if (data.success) {
                // Map DB names to UI names if necessary
                const mapped = data.data.map(c => ({
                    id: c.id,
                    shopName: c.shop_name,
                    address: c.address,
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
            // Need an API for this or use supabase client directly if client-side allowed
            // Using a generic check for now, we'll assume there's a live data endpoint or we fetch from restaurants
            const res = await fetch('/api/restaurants'); // Existing endpoint?
            const data = await res.json();
            if (data.success) setLiveData(data.data);
        } catch (e) {
            console.error('Fetch live restaurants error:', e);
            setLogs(prev => [...prev, `[ERROR] 本番データ取得中にエラーが発生しました: ${e.message}`]);
        }
    };

    const handleStartCollection = async () => {
        setIsCollecting(true);
        setStatus('processing');
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 処理を開始しました: ${selectedArea}`]);
        setActiveTab('inbox');

        try {
            const response = await fetch('/api/admin/collect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ area: selectedArea })
            });

            const data = await response.json();

            if (data.success) {
                await fetchCandidates();
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

    const approveCandidate = async (candidateId) => {
        try {
            const res = await fetch('/api/admin/candidates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ candidateId })
            });
            const data = await res.json();
            if (data.success) {
                setLogs(prev => [...prev, `[承認] データベースへ本番登録しました`]);
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
                const res = await fetch('/api/restaurants', { // Assuming a DELETE endpoint for restaurants
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

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">データ収集コンソール (Production)</h1>
                        <p className="text-slate-500 text-sm">収集データはまず承認待ちに入ります。内容を確認して本番反映してください。</p>
                    </div>
                </div>

                {/* Control Panel (Compact) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between gap-6">
                    <div className="flex-1 flex items-center gap-4">
                        <select
                            value={selectedArea}
                            onChange={(e) => setSelectedArea(e.target.value)}
                            className="h-10 rounded-lg border-slate-200 bg-slate-50 font-bold px-3 outline-none"
                        >
                            <option value="福岡県">福岡県</option>
                            <option value="東京都">東京都</option>
                        </select>
                        <Button
                            onClick={handleStartCollection}
                            disabled={isCollecting}
                            size="sm"
                        >
                            {isCollecting ? <><Loader2 className="animate-spin mr-2" size={16} /> 収集中...</> : <><Play className="fill-current mr-2" size={16} /> 収集開始</>}
                        </Button>
                    </div>
                    {/* Log Ticker */}
                    <div className="flex-1 text-right">
                        <span className="text-xs font-mono text-slate-400 truncate max-w-md inline-block">
                            {logs.length > 0 ? logs[logs.length - 1] : '準備完了'}
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl w-fit">
                    <button onClick={() => setActiveTab('inbox')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inbox' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>
                        承認待ち ({candidates.length})
                    </button>
                    <button onClick={() => setActiveTab('live')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'live' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}>
                        本番データ ({liveData.length})
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
                                    onApprove={() => approveCandidate(shop.id)}
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
                                <div>
                                    <div className="font-bold text-slate-800">{shop.name}</div>
                                    <div className="text-xs text-slate-500">{shop.address}</div>
                                </div>
                                <button onClick={() => deleteLiveData(shop.id)} className="text-xs text-red-500 font-bold bg-red-50 px-3 py-1 rounded hover:bg-red-100">削除</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function CandidateCard({ data, onApprove, onReject }) {
    // Determine status color based on reliability
    const isReliable = data.finalReliabilityScore >= 70;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 group hover:ring-2 hover:ring-primary/20 transition-all">
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-900">{data.shopName}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${isReliable ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                            信頼度: {data.finalReliabilityScore}
                        </span>
                        {/* Source Icons Carousel */}
                        <div className="flex -space-x-1">
                            {data.sources && data.sources.map((feed, idx) => (
                                <div key={idx} title={feed.type} className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[10px]">
                                    {feed.type[0].toUpperCase()}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                        <MapPin size={12} /> {data.address}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {data.menus && data.menus.map((menu, j) => (
                            <div key={j} className={`text-xs px-3 py-1.5 rounded-lg font-bold border flex items-center gap-2 ${menu.valueScore >= 80 ? 'bg-orange-50 text-orange-800 border-orange-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                <span>{menu.name}</span>
                                <span className="bg-white px-1.5 rounded text-[10px] shadow-sm text-slate-400">
                                    {menu.supportedAllergens.join(' ')}不使用
                                </span>
                                {menu.valueScore >= 80 && <Star size={10} className="fill-orange-500 text-orange-500" />}
                                {menu.valueScore <= 20 && <span className="text-[10px] text-slate-400">(低価値)</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[120px]">
                    <Button onClick={onApprove} size="sm" className="w-full bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200">
                        <CheckCircle size={16} className="mr-1" /> 承認
                    </Button>
                    <button onClick={onReject} className="w-full py-2 text-xs font-bold text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors flex items-center justify-center gap-1">
                        <AlertCircle size={14} /> 却下
                    </button>
                </div>
            </div>
        </div>
    );
}
