'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, CheckCircle, TrendingUp, Users, ExternalLink } from 'lucide-react';
import LineLoginButton from '@/components/LineLoginButton';
import './ProLogin.css';

/**
 * プロユーザー向け専用ログインページ
 * 投稿プレビュー、プロ特典の説明、投稿促進文言を含む
 */
export default function ProLoginPage() {
    return (
        <div className="pro-login-page">
            {/* Hero Section */}
            <div className="pro-hero">
                <div className="pro-hero-content">
                    <Image
                        src="/logo.png"
                        alt="あんしんレシピ"
                        width={280}
                        height={70}
                        priority
                        className="pro-logo"
                    />
                    <div className="pro-hero-badge">
                        <Star size={16} fill="currentColor" />
                        <span>プロユーザー専用</span>
                    </div>
                    <h1 className="pro-hero-title">
                        あなたのレシピで<br />
                        <span className="pro-highlight">アレルギーっ子を笑顔に</span>
                    </h1>
                    <p className="pro-hero-subtitle">
                        料理研究家・管理栄養士・食品メーカー様向け
                    </p>
                </div>
            </div>

            {/* Preview Section - How your recipes appear */}
            <section className="pro-section">
                <h2 className="pro-section-title">
                    <Star size={20} className="text-yellow-500" />
                    あなたのレシピはこのように表示されます
                </h2>
                <div className="pro-preview-card">
                    <div className="pro-preview-image">
                        <div className="pro-preview-badge">
                            <Star size={10} fill="currentColor" />
                            プロ
                        </div>
                        <div className="pro-preview-placeholder">
                            <span>🍳</span>
                        </div>
                        <div className="pro-preview-title">あなたのレシピタイトル</div>
                    </div>
                    <div className="pro-preview-features">
                        <div className="pro-feature-item">
                            <CheckCircle size={16} className="text-green-500" />
                            <span>金色の☆バッジで目立つ</span>
                        </div>
                        <div className="pro-feature-item">
                            <CheckCircle size={16} className="text-green-500" />
                            <span>プロフィールページで自己紹介</span>
                        </div>
                        <div className="pro-feature-item">
                            <CheckCircle size={16} className="text-green-500" />
                            <span>SNSリンクを掲載可能</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="pro-section pro-benefits">
                <h2 className="pro-section-title">プロユーザー特典</h2>
                <div className="pro-benefits-grid">
                    <div className="pro-benefit-card">
                        <div className="pro-benefit-icon">
                            <Star size={24} />
                        </div>
                        <h3>プロ認証バッジ</h3>
                        <p>投稿したレシピに☆マークが表示され、信頼性がアップ</p>
                    </div>
                    <div className="pro-benefit-card">
                        <div className="pro-benefit-icon">
                            <Users size={24} />
                        </div>
                        <h3>プロフィールページ</h3>
                        <p>自己紹介やSNSリンクを設定し、ファンを獲得</p>
                    </div>
                    <div className="pro-benefit-card">
                        <div className="pro-benefit-icon">
                            <TrendingUp size={24} />
                        </div>
                        <h3>露出アップ</h3>
                        <p>プロのレシピとしてユーザーから注目されやすく</p>
                    </div>
                    <div className="pro-benefit-card">
                        <div className="pro-benefit-icon">
                            <ExternalLink size={24} />
                        </div>
                        <h3>外部リンク</h3>
                        <p>Instagram, YouTube, ブログなどへのリンクを設置</p>
                    </div>
                </div>
            </section>

            {/* Easy Start Section */}
            <section className="pro-section pro-easy-start">
                <div className="pro-easy-content">
                    <div className="pro-easy-emoji">✨</div>
                    <h2>レシピ投稿だけ！手間なしスタート</h2>
                    <p className="pro-easy-description">
                        難しい設定は一切不要。<br />
                        <strong>いつものレシピを投稿するだけで</strong>、<br />
                        あなたのレシピが多くのアレルギーっ子家庭に届きます。
                    </p>
                    <ul className="pro-easy-list">
                        <li>
                            <CheckCircle size={18} className="text-green-500" />
                            <span>登録費用：<strong>無料</strong></span>
                        </li>
                        <li>
                            <CheckCircle size={18} className="text-green-500" />
                            <span>追加作業：<strong>なし</strong></span>
                        </li>
                        <li>
                            <CheckCircle size={18} className="text-green-500" />
                            <span>投稿方法：<strong>通常と同じ</strong></span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* CTA Section */}
            <section className="pro-section pro-cta">
                <div className="pro-cta-card">
                    <h2>今すぐ始めましょう</h2>
                    <p>LINEアカウントで簡単ログイン</p>
                    <LineLoginButton isProRegistration={true} />
                    <p className="pro-cta-note">
                        ログインをもって <Link href="/terms" className="pro-link">利用規約</Link>・<Link href="/privacy" className="pro-link">プライバシーポリシー</Link> に同意とみなします
                    </p>
                </div>
            </section>

            {/* Footer Link */}
            <div className="pro-footer">
                <Link href="/" className="pro-back-link">
                    一般ユーザーの方はこちら
                </Link>
            </div>
        </div>
    );
}
