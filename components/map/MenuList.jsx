'use client';

import React from 'react';
import { Star, ChevronRight } from 'lucide-react';
import './MenuList.css';

export const MenuList = ({ menus }) => {
    if (!menus || menus.length === 0) return null;

    return (
        <div className="menu-list-section">
            <div className="flex items-center justify-between mb-3 px-6">
                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <span className="text-2xl">🍽️</span> 食べられるメニュー
                </h2>
                <span className="text-xs text-orange-600 font-bold bg-orange-100 px-2 py-1 rounded-full">
                    {menus.length}件
                </span>
            </div>

            <div className="menu-scroll-container">
                {menus.map((menu, index) => (
                    <div key={index} className="menu-card">
                        <div className="menu-image-wrapper">
                            <img src={menu.image_url} alt={menu.name} className="menu-image" />
                            {menu.tags?.includes('8_major_free') && (
                                <span className="menu-tag-badge">特定原材料8種不使用</span>
                            )}
                        </div>
                        <div className="menu-content">
                            <h3 className="menu-name">{menu.name}</h3>
                            <p className="menu-desc">{menu.description}</p>
                            <div className="menu-footer">
                                <span className="menu-price">
                                    {menu.price ? `¥${menu.price.toLocaleString()} (税込)` : (menu.price_display || '価格データなし')}
                                </span>

                                {menu.source_url && (
                                    <a
                                        href={menu.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="source-link-btn"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        参照元
                                    </a>
                                )}

                                <div className="allergen-info-box">
                                    {!menu.allergens || menu.allergens.length === 0 ? (
                                        <span className="allergen-safe-text">アレルギー配慮メニュー</span>
                                    ) : (
                                        <div className="flex gap-1 flex-wrap">
                                            {menu.allergens.map(a => (
                                                <span key={a} className="allergen-tag">{a}不使用</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
