import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './TermsPage.css'; // Reuse styles

const PrivacyPage = () => {
    const navigate = useNavigate();

    return (
        <div className="legal-page container">
            <div className="legal-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    <ArrowLeft size={24} />
                    <span className="back-text">ホームに戻る</span>
                </button>
                <h1 className="legal-title">プライバシーポリシー</h1>
                <p className="legal-date">制定日: 2025年12月8日</p>
            </div>

            <div className="legal-content">
                <section className="legal-section">
                    <h2>1. 個人情報の取り扱いについて</h2>
                    <p>
                        あんしんレシピ（以下「当アプリ」）は、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
                    </p>
                </section>

                <section className="legal-section">
                    <h2>2. 収集する情報</h2>
                    <ul className="legal-list">
                        <li>ユーザーが登録するお子様のニックネーム、アレルギー情報、アイコン画像</li>
                        <li>当アプリの利用履歴、検索履歴、お気に入り情報</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>3. 情報の利用目的</h2>
                    <p>収集した情報は、主に以下の目的で利用します。</p>
                    <ul className="legal-list">
                        <li>ユーザーに合わせたレシピのフィルタリングおよび提案のため</li>
                        <li>サービスの改善、新機能の開発のため</li>
                        <li>ユーザーからのお問い合わせに対応するため</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>4. お問い合わせ</h2>
                    <p>
                        本ポリシーに関するお問い合わせは、お問い合わせフォームよりご連絡ください。
                    </p>
                </section>
            </div>
        </div>
    );
};

export default PrivacyPage;
