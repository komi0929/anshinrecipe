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
                        <span>プロユーザーさま専用</span>
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

            {/* Service Introduction Section */}
            <section className="pro-section pro-intro">
                <div className="pro-intro-card">
                    <div className="pro-intro-image">
                        <Image
                            src="/pro-intro.jpg"
                            alt="あんしんレシピの紹介"
                            width={400}
                            height={400}
                            className="rounded-xl shadow-lg"
                        />
                    </div>
                    <p className="pro-intro-text">
                        あんしんレシピは、アレルギーっ子のためのレシピ共有アプリです。同じお悩みをもつママパパ同士が、気にいったレシピを共有することができます。
                    </p>
                </div>
            </section>

            {/* Easy Start Section - Swapped to top of blocks */}
            <section className="pro-section pro-easy-start">
                <div className="pro-easy-content">
                    <div className="pro-easy-emoji">✨</div>
                    <h2>レシピ投稿だけ！手間なしスタート</h2>
                    <div className="pro-easy-description">
                        <p>難しい設定は一切不要。</p>
                        <p className="pro-highlight-block">
                            <strong>Instagram等に投稿されているレシピのURLを貼り付けるだけ</strong>で、<br />
                            いつものレシピが自動的に取り込まれます。
                        </p>
                        <p>
                            あなたのレシピが、多くのアレルギーっ子家庭に届きます。
                        </p>
                    </div>
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

            {/* Benefits Section - Swapped to bottom of blocks */}
            <section className="pro-section pro-benefits">
                <h2 className="pro-section-title">プロユーザーさま向け機能</h2>
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
