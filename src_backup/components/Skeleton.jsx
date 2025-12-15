import React from 'react';
import './Skeleton.css';

export const Skeleton = ({ width, height, borderRadius = '4px', className = '' }) => {
    const style = {
        width,
        height,
        borderRadius,
    };

    return <div className={`skeleton ${className}`} style={style}></div>;
};

export const RecipeCardSkeleton = () => {
    return (
        <div className="recipe-card-skeleton">
            <Skeleton width="100%" height="180px" borderRadius="8px 8px 0 0" />
            <div className="p-3">
                <Skeleton width="80%" height="20px" className="mb-2" />
                <Skeleton width="40%" height="16px" />
            </div>
        </div>
    );
};
