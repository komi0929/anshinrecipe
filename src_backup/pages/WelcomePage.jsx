import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, User, BookOpen } from 'lucide-react';
import './WelcomePage.css';

const WelcomePage = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/profile');
    };

    return (
        <div className="welcome-page">
            <div className="welcome-content">
                <div className="welcome-icon">
                    <Heart size={64} color="#FF9F43" fill="#FFE0B2" />
                </div>

                <h1 className="welcome-title">あんしんレシピへ<br />ようこそ</h1>

                <p className="welcome-subtitle">
                    食物アレルギーのお子様のための<br />
                    レシピ管理アプリです
                </p>

                <div className="feature-list">
                    <div className="feature-item">
                        <div className="feature-icon">
                            <User size={24} color="#48C9B0" />
                        </div>
                        <div className="feature-text">
                            <h3>お子様のアレルギー登録</h3>
                            <p>28品目＋自由設定で管理</p>
                        </div>
                    </div>

                    <div className="feature-item">
                        <div className="feature-icon">
                            <BookOpen size={24} color="#FF9F43" />
                        </div>
                        <div className="feature-text">
                            <h3>レシピを簡単に保存</h3>
                            <p>お気に入りのレシピをメモ</p>
                        </div>
                    </div>

                    <div className="feature-item">
                        <div className="feature-icon">
                            <Heart size={24} color="#FF6B6B" />
                        </div>
                        <div className="feature-text">
                            <h3>安全チェック</h3>
                            <p>お子様ごとに安全性を確認</p>
                        </div>
                    </div>
                </div>

                <button onClick={handleGetStarted} className="btn btn-primary btn-large">
                    はじめる
                </button>

                <p className="welcome-note">
                    まずはお子様のプロフィールを<br />
                    登録しましょう
                </p>
            </div>
        </div>
    );
};

export default WelcomePage;
