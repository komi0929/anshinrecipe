'use client';

import React from 'react';
import Link from 'next/link';
import { User, Star } from 'lucide-react';
import './ProBadge.css';

/**
 * プロユーザー対応アバターコンポーネント
 * プロユーザーの場合、金色の縁取りと認証バッジを表示
 * クリックでプロフィールページへ遷移可能
 */
export const ProAvatar = ({
    src,
    alt = 'ユーザー',
    isPro = false,
    userId,
    size = 40,
    showBadge = true,
    clickable = true,
    className = ''
}) => {
    const badgeSizeClass = size <= 32 ? 'pro-avatar-badge-sm' : size >= 56 ? 'pro-avatar-badge-lg' : '';
    const badgeIconSize = size <= 32 ? 10 : size >= 56 ? 14 : 12;

    const avatarContent = (
        <div className={`pro-avatar-wrapper ${isPro ? 'is-pro' : ''} ${clickable && isPro ? 'clickable' : ''} ${className}`}>
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    width={size}
                    height={size}
                    className="pro-avatar-image"
                    style={{ width: size, height: size }}
                />
            ) : (
                <div
                    className="pro-avatar-placeholder"
                    style={{ width: size, height: size }}
                >
                    <User size={size * 0.5} />
                </div>
            )}
            {isPro && showBadge && (
                <span className={`pro-avatar-badge ${badgeSizeClass}`}>
                    <Star size={badgeIconSize} fill="currentColor" />
                </span>
            )}
        </div>
    );

    // プロユーザーでクリック可能な場合はプロフィールページへリンク
    if (isPro && clickable && userId) {
        return (
            <Link href={`/pro/${userId}`} className="pro-avatar-link">
                {avatarContent}
            </Link>
        );
    }

    return avatarContent;
};

export default ProAvatar;
