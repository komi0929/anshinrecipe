'use client';

import React from 'react';
import Link from 'next/link';
import './Footer.css';

export const Footer = ({ showLinks = true }) => {
    return (
        <footer className="w-full bg-slate-50 border-t border-slate-200 py-8 pb-16 mt-auto">
            <div className="container mx-auto px-4 text-center">
                {showLinks && (
                    <div className="flex flex-row flex-wrap justify-center items-center gap-6 mb-8 text-sm text-slate-600">
                        <Link href="/terms" className="hover:text-amber-500 transition-colors">利用規約</Link>
                        <Link href="/privacy" className="hover:text-amber-500 transition-colors">プライバシーポリシー</Link>
                    </div>
                )}

                <div className="text-xs text-slate-400 footer-disclaimer">
                    <p className="mb-2 max-w-lg mx-auto leading-relaxed font-bold text-slate-500">
                        ※レシピの安全を完全に保証するものではありません。
                    </p>
                    <p className="mb-4 max-w-lg mx-auto leading-relaxed font-bold text-slate-500">
                        使用されている食材はご自身でもご確認ください。
                    </p>
                    <p>&copy; 2025 Hitokoto Inc. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};
