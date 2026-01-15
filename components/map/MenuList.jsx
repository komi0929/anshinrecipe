'use client';

import React from 'react';
import { Star, ChevronRight } from 'lucide-react';
import './MenuList.css';

export const MenuList = ({ menus }) => {
    if (!menus || menus.length === 0) return null;

    return (
        <div className="menu-list-section">
            <div className="flex items-center justify-between mb-3 px-6">
                <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <span className="text-2xl">🍽️</span> 食べられるメニュー
                </h2>
                <span className="text-xs text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                    {menus.length}件
                </span>
            </div>

            <div className="menu-scroll-container pb-8">
                {menus.map((menu, index) => (
                    <div key={index} className="menu-card group relative bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 min-w-[280px] max-w-[280px] flex-shrink-0 flex flex-col h-full">
                        {/* Image */}
                        <div className="relative h-40 overflow-hidden bg-slate-200">
                            {menu.image_url ? (
                                <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <span className="text-xs">No Image</span>
                                </div>
                            )}
                            {menu.tags?.includes('8_major_free') && (
                                <span className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                                    特定原材料8種不使用
                                </span>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-4 flex flex-col flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-slate-800 text-base leading-tight line-clamp-2 pr-1">{menu.name}</h3>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mb-3 h-[32px]">{menu.description}</p>

                            {/* Price & Ref */}
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold text-orange-600 text-sm">
                                    {menu.price ? `¥${menu.price.toLocaleString()}` : (menu.price_display || '')}
                                    <span className="text-[10px] text-slate-400 font-normal ml-0.5">(税込)</span>
                                </span>
                                {menu.source_url && (
                                    <a
                                        href={menu.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-slate-400 hover:text-blue-500 underline"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        参照元
                                    </a>
                                )}
                            </div>

                            {/* Premium Allergy Matrix */}
                            <div className="mt-auto pt-3 border-t border-slate-50">
                                <div className="text-[10px] font-bold text-slate-400 mb-2 flex items-center justify-between">
                                    <span>アレルギー判定</span>
                                    <span className="text-[9px] font-normal text-slate-300">※店舗要確認</span>
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                    {[
                                        { k: 'wheat', l: '小麦' },
                                        { k: 'egg', l: '卵' },
                                        { k: 'milk', l: '乳' },
                                        { k: 'peanut', l: 'ナッツ' } // Mapping peanut to Nut/Peanut display
                                    ].map(item => {
                                        const isContained = menu.allergens_contained?.includes(item.k);
                                        const isRemovable = menu.allergens_removable?.includes(item.k);

                                        // Logic: 
                                        // Default (Unchecked in Admin) -> Safe (Green)
                                        // Checked Contained -> Danger (Gray/Red)
                                        // Checked Removable -> Info (Blue)
                                        // If BOTH Contained and Removable -> Removable takes precedence for visibility? No, usually "Contains but Removable".

                                        let statusClass = "bg-emerald-50 border-emerald-100 text-emerald-700";
                                        let label = "不使用";

                                        if (isRemovable) {
                                            statusClass = "bg-blue-50 border-blue-100 text-blue-600";
                                            label = "除去可";
                                        } else if (isContained) {
                                            statusClass = "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
                                            label = "使用";
                                        }

                                        return (
                                            <div key={item.k} className={`flex flex-col items-center justify-center p-1 rounded border ${statusClass}`}>
                                                <span className="text-[9px] font-bold mb-0.5">{item.l}</span>
                                                <span className="text-[8px] font-bold tracking-tighter">{label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
