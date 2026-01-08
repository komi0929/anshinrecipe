'use client';

import React from 'react';
import { Star } from 'lucide-react';

/**
 * プロユーザーバッジコンポーネント
 * プロユーザーを示す☆マークを表示
 */
export const ProBadge = ({ size = 'sm', className = '' }) => {
    const sizeClasses = {
        xs: 'pro-badge-xs',
        sm: 'pro-badge-sm',
        md: 'pro-badge-md',
        lg: 'pro-badge-lg'
    };

    return (
        <span className={`pro-badge ${sizeClasses[size]} ${className}`}>
            <Star size={size === 'xs' ? 10 : size === 'sm' ? 12 : size === 'md' ? 14 : 16} fill="currentColor" />
            <span className="pro-badge-text">プロ</span>
        </span>
    );
};

/**
 * プロユーザーバッジ（アイコンのみ）
 * レシピカードなど小さいスペース用
 */
export const ProBadgeIcon = ({ size = 14, className = '' }) => {
    return (
        <span className={`pro-badge-icon ${className}`} title="プロユーザー">
            <Star size={size} fill="currentColor" />
        </span>
    );
};

export default ProBadge;
