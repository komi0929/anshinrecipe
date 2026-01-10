'use client'

import React from 'react';
import './HeartBurst.css';

/**
 * HeartBurst - いいねボタン押下時のパーティクルエフェクト
 * 
 * 6つの小さなハートが放射状に飛び散るアニメーション。
 * マイクロインタラクションでUXを向上させる。
 */
export const HeartBurst = ({ active }) => {
    if (!active) return null;

    return (
        <div className="heart-burst">
            {[...Array(6)].map((_, i) => (
                <span
                    key={i}
                    className="heart-particle"
                    style={{ '--i': i }}
                />
            ))}
        </div>
    );
};

export default HeartBurst;
