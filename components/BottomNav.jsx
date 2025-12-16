'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, User } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useNotifications } from '../hooks/useNotifications';
import './BottomNav.css';

const BottomNav = () => {
    const pathname = usePathname();
    const { user, profile } = useProfile();
    const { unreadCount } = useNotifications(user?.id);

    // Don't show bottom nav if user is not logged in or on login/welcome pages
    if (!user || pathname === '/login' || pathname === '/welcome') {
        return null;
    }

    return (
        <nav className="bottom-nav">
            <Link
                href="/"
                className={`nav-item ${pathname === '/' ? 'active' : ''}`}
            >
                <Home size={24} />
                <span>レシピ</span>
            </Link>

            <Link
                href="/recipe/new"
                className={`nav-item ${pathname === '/recipe/new' ? 'active' : ''}`}
            >
                <PlusCircle size={24} />
                <span>追加</span>
            </Link>

            <Link
                href="/profile"
                className={`nav-item ${pathname === '/profile' ? 'active' : ''}`}
            >
                <div className="relative">
                    {profile?.avatarUrl ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200">
                            <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <User size={24} />
                    )}
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </div>
                <span>プロフィール</span>
            </Link>
        </nav>
    );
};

export default BottomNav;
