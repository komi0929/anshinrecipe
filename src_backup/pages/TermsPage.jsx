import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './TermsPage.css';

const TermsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="legal-page container">
            <div className="legal-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    <ArrowLeft size={24} />
                    <span className="back-text">ホームに戻る</span>
                </button>
                <h1 className="legal-title">利用規約</h1>
                <p className="legal-date">制定日: 2025年12月8日</p>
            </div>

            <div className="legal-content">
                <section className="legal-section">
                    <h2>第1条 （はじめに）</h2>
                    <p>
                        この利用規約（以下「本規約」といいます。）は、トコト（以下「当社」といいます。）が提供する「あんしんレシピ」（以下「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。
                    </p>
                </section>

                <section className="legal-section">
                    <h2>第2条 （重要：アレルギー情報について）</h2>
                    <ul className="legal-list">
                        <li>本サービス内のレシピ情報、アレルギー対応表示等は、投稿ユーザーの自己申告に基づくものです。<strong>正確性、安全性、完全性を保証するものではありません。</strong></li>
                        <li>食品の原材料は、メーカーや製品のリニューアル、製造ラインのコンタミネーション（微量混入）によって変更されることがあります。</li>
                        <li><strong>実際に調理、喫食する際は、必ずご自身で使用する食材のパッケージ表示（原材料・アレルギー表示）をご確認ください。</strong></li>
                        <li>本サービスの情報区分を利用した結果生じた、アレルギー発症等のいかなる損害についても、当社は一切の責任を負いません。最終的な判断は保護者または利用者の責任において行ってください。</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>第3条 （禁止事項）</h2>
                    <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
                    <ul className="legal-list">
                        <li>法令または公序良俗に違反する行為</li>
                        <li>犯罪行為に関連する行為</li>
                        <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
                        <li>当社、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                    </ul>
                </section>
                {/* Added extra space at bottom to ensure scrolling above footer if needed */}
                <div className="spacer"></div>
            </div>
        </div>
    );
};

export default TermsPage;
