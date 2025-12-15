import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import '../LegalPages.css';

export const metadata = {
    title: '利用規約 | あんしんレシピ',
    description: 'あんしんレシピの利用規約です。',
};

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl pb-24 legal-page-wrapper">
            <Link href="/" className="legal-nav-link">
                <ArrowLeft size={20} className="mr-2" />
                ホームに戻る
            </Link>

            <h1 className="legal-title">利用規約</h1>

            <div className="legal-card">
                <p className="legal-date">制定日: 2025年12月8日</p>

                <section className="legal-section">
                    <h2 className="legal-h2">第1条（はじめに）</h2>
                    <p className="legal-text">
                        この利用規約（以下「本規約」といいます。）は、株式会社ヒトコト（以下「当社」といいます。）が提供するサービス「あんしんレシピ」（以下「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。
                    </p>
                </section>

                <section className="legal-section legal-alert">
                    <h2 className="legal-h2 legal-alert-title">第2条（重要：アレルギー情報の免責）</h2>
                    <ul className="legal-list legal-alert-list">
                        <li>
                            本サービス内のレシピ情報、アレルギー対応ラベル、検索結果等は、投稿ユーザーの自己申告に基づくものであり、<strong>その正確性、安全性、完全性を保証するものではありません。</strong>
                        </li>
                        <li>
                            食品の原材料は、メーカーや製品のリニューアル、製造ラインのコンタミネーション（微量混入）によって異なる場合があります。
                        </li>
                        <li>
                            <strong>実際に調理、喫食する際は、必ずご自身で使用する食材のパッケージ表示（原材料・アレルギー表示）をご確認ください。</strong>
                        </li>
                        <li>
                            本サービスの情報を利用した結果生じた、アレルギー反応等のいかなる損害についても、当社は一切の責任を負いません。最終的な判断は保護者または利用者の責任において行ってください。
                        </li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2 className="legal-h2">第3条（禁止事項）</h2>
                    <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
                    <ul className="legal-list">
                        <li>法令または公序良俗に違反する行為</li>
                        <li>犯罪行為に関連する行為</li>
                        <li>本サービスの内容等、本サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
                        <li>虚偽のアレルギー情報を含むレシピを意図的に投稿する行為</li>
                        <li>他のユーザーに成りすます行為</li>
                        <li>反社会的勢力に対して直接または間接に利益を供与する行為</li>
                        <li>その他、当社が不適切と判断する行為</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2 className="legal-h2">第4条（本サービスの提供の停止等）</h2>
                    <p className="legal-text">
                        当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                    </p>
                    <ul className="legal-list">
                        <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                        <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                        <li>その他、当社が本サービスの提供が困難と判断した場合</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2 className="legal-h2">第5条（利用制限および登録抹消）</h2>
                    <p className="legal-text">
                        当社は、ユーザーが本規約のいずれかの条項に違反した場合、事前の通知なく、ユーザーに対して本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
                    </p>
                </section>

                <section className="legal-section">
                    <h2 className="legal-h2">第6条（保証の否認および免責事項）</h2>
                    <p className="legal-text">
                        当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
                    </p>
                </section>

                <section className="legal-section">
                    <h2 className="legal-h2">第7条（準拠法・裁判管轄）</h2>
                    <p className="legal-text">
                        本規約の解釈にあたっては、日本法を準拠法とします。
                        本サービスに関して紛争が生じた場合には、福岡地方裁判所を専属的合意管轄とします。
                    </p>
                </section>

                <section className="legal-section">
                    <h2 className="legal-h2">第8条（お問い合わせ）</h2>
                    <p className="legal-text">
                        本サービスに関するお問い合わせは、下記までお願いいたします。
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
