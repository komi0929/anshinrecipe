import React from 'react';
import './Skeleton.css';

export const Skeleton = ({ width, height, borderRadius = '4px', className = '', variant = 'shimmer' }) => {
    const style = {
        width,
        height,
        borderRadius,
    };

    const variantClass = variant === 'pulse' ? 'skeleton-pulse' : '';

    return <div className={`skeleton ${variantClass} ${className}`} style={style}></div>;
};

export const RecipeCardSkeleton = () => {
    return (
        <div className="recipe-card-skeleton">
            <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden' }}>
                <Skeleton width="100%" height="100%" borderRadius="0" />
            </div>
            <div className="p-3">
                <Skeleton width="80%" height="20px" className="mb-2" />
                <Skeleton width="40%" height="16px" />
            </div>
        </div>
    );
};

// 🆕 Recipe Detail Page Skeleton
export const RecipeDetailSkeleton = () => {
    return (
        <div className="skeleton-detail">
            {/* Hero Image */}
            <Skeleton className="skeleton-hero" />

            {/* Title */}
            <Skeleton className="skeleton-title" />

            {/* Author */}
            <div className="skeleton-author">
                <Skeleton className="skeleton-avatar" />
                <Skeleton className="skeleton-name" />
            </div>

            {/* Content Sections */}
            <div className="skeleton-section">
                <Skeleton className="skeleton-section-title" />
                <Skeleton width="100%" className="skeleton-text" />
                <Skeleton width="90%" className="skeleton-text" />
                <Skeleton width="75%" className="skeleton-text" />
            </div>

            <div className="skeleton-section">
                <Skeleton className="skeleton-section-title" />
                <Skeleton width="100%" className="skeleton-text" />
                <Skeleton width="85%" className="skeleton-text" />
            </div>
        </div>
    );
};

// 🆕 Profile Card Skeleton
export const ProfileCardSkeleton = () => {
    return (
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
            <Skeleton width="64px" height="64px" borderRadius="50%" />
            <div className="flex-1">
                <Skeleton width="120px" height="18px" className="mb-2" />
                <Skeleton width="80px" height="14px" />
            </div>
        </div>
    );
};

// 🆕 List Item Skeleton with variable count
export const ListSkeleton = ({ count = 3 }) => {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <Skeleton width="48px" height="48px" borderRadius="8px" />
                    <div className="flex-1">
                        <Skeleton width="70%" height="16px" className="mb-2" />
                        <Skeleton width="50%" height="12px" />
                    </div>
                </div>
            ))}
        </div>
    );
};
