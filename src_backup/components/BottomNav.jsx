import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, BookOpen } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
    return (
        <nav className="bottom-nav">
            <NavLink
                to="/"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
                <Home />
                <span>レシピ</span>
            </NavLink>
            <NavLink
                to="/profile"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
                <User />
                <span>プロフィール</span>
            </NavLink>
        </nav>
    );
};

export default BottomNav;
