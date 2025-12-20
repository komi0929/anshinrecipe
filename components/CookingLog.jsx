'use client'

import React, { useState } from 'react';
import { Send, Trash2, Star, StickyNote, Lock } from 'lucide-react';

export const CookingLog = ({ logs = [], onAddLog, onDeleteLog, currentUserId }) => {
    const [newLog, setNewLog] = useState('');
    const [rating, setRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter logs to show only current user's logs
    const myLogs = logs.filter(log => log.user_id === currentUserId);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newLog.trim()) return;

        setIsSubmitting(true);
        try {
            await onAddLog({
                content: newLog,
                rating: rating > 0 ? rating : null,
                created_at: new Date().toISOString()
            });
            setNewLog('');
            setRating(0);
        } catch (error) {
            console.error('Failed to add log', error);
            alert('メモの保存に失敗しました');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (logId) => {
        if (!confirm('このメモを削除しますか？')) return;
        try {
            await onDeleteLog(logId);
        } catch (error) {
            console.error('Failed to delete log', error);
            alert('メモの削除に失敗しました');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    };

    return (
        <div className="my-memo-section" style={{
            marginTop: '32px',
            padding: '20px',
            backgroundColor: '#fffbeb',
            borderRadius: '20px',
            border: '1px solid #fdefc8'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
            }}>
                <span style={{ fontSize: '20px' }}>📝</span>
                <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#1f2937',
                    margin: 0
                }}>マイメモ</h3>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '8px',
                    padding: '2px 8px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                }}>
                    <Lock size={10} style={{ color: '#94a3b8' }} />
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '500' }}>非公開</span>
                </div>
            </div>

            <p style={{
                fontSize: '13px',
                color: '#64748b',
                marginBottom: '16px',
                lineHeight: '1.5'
            }}>
                自分だけが見られる備忘録です。アレンジのアイデアや子どもの反応をメモしておきましょう。
            </p>

            {/* Input Form */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '16px',
                border: '1px solid #fde68a',
                marginBottom: '20px'
            }}>
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={newLog}
                        onChange={(e) => setNewLog(e.target.value)}
                        placeholder="例：次回は砂糖を減らしてみる。子どもが喜んで食べた！"
                        style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '12px',
                            border: '1px solid #fde68a',
                            borderRadius: '12px',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            resize: 'none',
                            backgroundColor: 'white',
                            color: '#374151',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#f59e0b'}
                        onBlur={(e) => e.target.style.borderColor = '#fde68a'}
                    />

                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        marginTop: '12px'
                    }}>
                        <button
                            type="submit"
                            disabled={!newLog.trim() || isSubmitting}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '10px 20px',
                                borderRadius: '24px',
                                border: 'none',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: !newLog.trim() || isSubmitting ? 'not-allowed' : 'pointer',
                                backgroundColor: !newLog.trim() || isSubmitting ? '#fef3c7' : '#f59e0b',
                                color: !newLog.trim() || isSubmitting ? '#d97706' : 'white',
                                transition: 'all 0.2s'
                            }}
                        >
                            <StickyNote size={14} />
                            メモを追加
                        </button>
                    </div>
                </form>
            </div>

            {/* Memo Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myLogs.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '32px 16px',
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        border: '2px dashed #fde68a'
                    }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px', opacity: '0.5' }}>📌</div>
                        <p style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#94a3b8',
                            margin: '0 0 4px 0'
                        }}>まだメモがありません</p>
                        <p style={{
                            fontSize: '12px',
                            color: '#94a3b8',
                            margin: 0,
                            lineHeight: '1.5'
                        }}>気づいたことや試したいことを<br />書き留めておきましょう</p>
                    </div>
                ) : (
                    myLogs.map((log) => (
                        <div
                            key={log.id}
                            style={{
                                backgroundColor: 'white',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                border: '1px solid #fde68a',
                                position: 'relative'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        color: '#92400e',
                                        backgroundColor: '#fef3c7',
                                        padding: '2px 8px',
                                        borderRadius: '4px'
                                    }}>
                                        {formatDate(log.created_at)}
                                    </span>
                                </div>
                                {onDeleteLog && (
                                    <button
                                        onClick={() => handleDelete(log.id)}
                                        style={{
                                            padding: '4px',
                                            borderRadius: '50%',
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            cursor: 'pointer',
                                            opacity: '0.4',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.opacity = '1';
                                            e.target.style.backgroundColor = '#fef2f2';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.opacity = '0.4';
                                            e.target.style.backgroundColor = 'transparent';
                                        }}
                                        title="削除"
                                    >
                                        <Trash2 size={14} color="#ef4444" />
                                    </button>
                                )}
                            </div>
                            <p style={{
                                fontSize: '14px',
                                color: '#374151',
                                lineHeight: '1.6',
                                margin: 0,
                                paddingRight: '24px'
                            }}>{log.content}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
