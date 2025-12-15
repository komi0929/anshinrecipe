import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import '../LegalPages.css';

export const metadata = {
    title: 'プライバシーポリシー | あんしんレシピ',
    description: 'あんしんレシピのプライバシーポリシーです。',
};

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl pb-24 legal-page-wrapper">
            <Link href="/" className="legal-nav-link">
                <ArrowLeft size={20} className="mr-2" />
                ホームに戻る
            </Link>

            <h1 className="legal-title">プライバシーポリシー</h1>

            <div className="legal-card">
                <p className="legal-date">制定日: 2025年12月8日</p>

                <section className="legal-section">
                    <h2 className="legal-h2">1. 基本方針</h2>
                    <p className="legal-text">
                        株式会社ヒトコト（以下「当社」といいます。）は、当社が提供するアプリ「あんしんレシピ」（以下「本アプリ」といいます。）において、ユーザーの個人情報を適切に保護することを社会的責務と考え、個人情報の保護に関する法律（個人情報保護法）その他関係法令を遵守します。
                    </p>
                </section>

                <section className="legal-section">
                    <h2 className="legal-h2">2. 取得する情報</h2>
                    <p className="legal-text">当社は、本アプリにおいて以下の情報を取得します。</p>
                    <ul className="legal-list">
                        <li><strong>ユーザー登録情報:</strong> ニックネーム、メールアドレス、プロフィール画像</li>
                        <li><strong>要配慮個人情報（アレルギー情報）:</strong> ユーザーが登録するお子様のアレルギー品目情報。これらは本アプリの核心機能（レシピのフィルタリング、安全確認）を提供するためにのみ使用されます。</li>
                        <li><strong>利用履歴:</strong> レシピの閲覧履歴、お気に入り、作成したレシピ情報</li>
                    </ul>
                </section>

                <section className="legal-section privacy-alert">
                    <h2 className="legal-h2">3. アレルギー情報の取り扱いについて</h2>
                    <p className="legal-text">
                        ユーザーが登録したアレルギー情報は、個人情報保護法上の「要配慮個人情報」として厳重に管理いたします。
                        これらの情報は、ユーザーご本人の同意なく第三者に提供することはありません。また、本アプリの機能提供（レシピの安全判定、検索フィルタリング）以外の目的で使用することはありません。
                    </p>
                </section>

                <section className="legal-section">
                    <h2 className="legal-h2">4. 利用目的</h2>
                    <p className="legal-text">取得した情報は、以下の目的で利用します。</p>
                    <ul className="legal-list">
                        <li>本アプリの機能提供およびサービスの運営</li>
                        <li>ユーザーからのお問い合わせへの対応</li>
                        <li>本アプリの改善、新機能の開発</li>
                        <li>利用規約に違反する行為の防止・対応</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2 className="legal-h2">5. 第三者提供</h2>
                    <p className="legal-text">
                        当社は、法令に基づく場合を除き、あらかじめユーザーの同意を得ることなく、個人情報を第三者に提供しません。
                    </p>
                </section>

                <section className="legal-section">
                    <h2 className="legal-h2">6. お問い合わせ窓口</h2>
                    <p className="legal-text">
                        本ポリシーに関するお問い合わせは、下記までお願いいたします。
                    </p>
                    <div className="contact-box">
                        <p><strong>株式会社ヒトコト</strong></p>
                        <p className="mt-1">担当：小南</p>
                        <p className="mt-1">Email: <a href="mailto:y.kominami@hitokoto1.co.jp" className="text-emerald-600 hover:underline">y.kominami@hitokoto1.co.jp</a></p>
                    </div>
                </section>
            </div>
        </div>
    );
}
