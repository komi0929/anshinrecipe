import React, { useState, useEffect } from 'react';
import { Trash2, User as UserIcon, Heart } from 'lucide-react';
import { toggleReportLike, getReportLikeInfo } from '../lib/actions/socialActions';
import './TriedReportCard.css';

const TriedReportCard = ({ report, currentUserId, onDelete }) => {
    const reportUserId = report.userId || report.user_id;
    const isOwner = currentUserId && reportUserId === currentUserId;
    const [likeCount, setLikeCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [isLiking, setIsLiking] = useState(false);

    useEffect(() => {
        const fetchLikeInfo = async () => {
            const info = await getReportLikeInfo(report.id, currentUserId);
            setLikeCount(info.count);
            setIsLiked(info.isLiked);
        };
        fetchLikeInfo();
    }, [report.id, currentUserId]);

    const handleLike = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!currentUserId) {
            alert('いいねするにはログインが必要です');
            return;
        }
        if (isLiking) return;

        setIsLiking(true);
        try {
            const liked = await toggleReportLike(report.id, currentUserId);
            setIsLiked(liked);
            setLikeCount(prev => liked ? prev + 1 : prev - 1);
        } catch (error) {
            console.error('Error liking report:', error);
        } finally {
            setIsLiking(false);
        }
    };

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
                    {(report.author?.avatarUrl || report.profiles?.avatar_url) ? (
                        <img
                            src={report.author?.avatarUrl || report.profiles?.avatar_url}
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
                            {(report.author?.display_name || report.author?.username || report.profiles?.display_name || report.profiles?.username || 'ゲスト')}
                        </span>
                        <span className="timestamp">
                            {formatDate(report.createdAt || report.created_at)}
                        </span>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        onClick={handleLike}
                        className={`report-like-btn ${isLiked ? 'active' : ''}`}
                        disabled={isLiking}
                    >
                        <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                        {likeCount > 0 && <span className="like-count">{likeCount}</span>}
                    </button>
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
            </div>

            {(report.imageUrl || report.image_url) ? (
                <div className="report-image">
                    <img src={report.imageUrl || report.image_url} alt="レポート画像" />
                </div>
            ) : null}

            {report.comment && (
                <p className="report-comment">{report.comment}</p>
            )}
        </div>
    );
};

export default TriedReportCard;
