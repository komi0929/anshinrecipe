'use client'

import React from 'react';
import { Trash2, User as UserIcon } from 'lucide-react';
import './TriedReportCard.css';

const TriedReportCard = ({ report, currentUserId, onDelete }) => {
    const isOwner = currentUserId && report.user_id === currentUserId;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'たった今';
        if (diffMins < 60) return `${diffMins}分前`;
        if (diffHours < 24) return `${diffHours}時間前`;
        if (diffDays < 7) return `${diffDays}日前`;
        return date.toLocaleDateString('ja-JP');
    };

    return (
        <div className="tried-report-card">
            <div className="report-header">
                <div className="user-info">
                    {report.profiles?.avatar_url ? (
                        <img
                            src={report.profiles.avatar_url}
                            alt=""
                            className="user-avatar"
                        />
                    ) : (
                        <div className="user-avatar-placeholder">
                            <UserIcon size={16} />
                        </div>
                    )}
                    <div className="user-details">
                        <span className="username">
                            {report.profiles?.username || 'ゲスト'}
                        </span>
                        <span className="timestamp">
                            {formatDate(report.created_at)}
                        </span>
                    </div>
                </div>
                {isOwner && onDelete && (
                    <button
                        onClick={() => onDelete(report.id)}
                        className="delete-btn"
                        title="削除"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {report.image_url ? (
                <div className="report-image">
                    <img src={report.image_url} alt="レポート画像" />
                </div>
            ) : null}

            {report.comment && (
                <p className="report-comment">{report.comment}</p>
            )}
        </div>
    );
};

export default TriedReportCard;
