"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Star,
  MessageSquare,
  Bookmark,
  ShieldCheck,
  PenTool,
  Search,
} from "lucide-react";
import "../../globals.css";

/**
 * マップ専用ウェルカムページ（92件改善 Phase4: オンボーディング）
 * 4.1 マップ専用Welcome画面作成
 * 4.2 マップ機能説明セクション追加
 */
export default function MapWelcomePage() {
  return (
    <div className="container" style={{ paddingBottom: "40px" }}>
      {/* Header */}
      <div
        className="page-header"
        style={{ display: "flex", alignItems: "center", gap: "12px" }}
      >
        <Link
          href="/map"
          style={{
            display: "flex",
            alignItems: "center",
            color: "var(--color-text-sub)",
          }}
        >
          <ArrowLeft size={24} />
        </Link>
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          あんしんマップの使い方
        </h1>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div className="card fade-in">
          <h2
            style={{
              fontSize: "1.25rem",
              marginBottom: "16px",
              color: "var(--color-primary)",
              textAlign: "center",
            }}
          >
            🗺️ あんしんマップへようこそ！
          </h2>
          <p
            style={{
              lineHeight: "1.8",
              color: "var(--color-text-main)",
              marginBottom: "24px",
            }}
          >
            食物アレルギーを持つお子様と一緒に、
            <strong>「安心して外食できるお店」</strong>
            を見つけるための地図です。 みんなの投稿で、どんどん便利になります！
          </p>
        </div>

        {/* Step 1 */}
        <div className="card fade-in" style={{ animationDelay: "0.1s" }}>
          <div
            style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
          >
            <div
              style={{
                background: "var(--color-primary-light)",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "var(--color-primary)",
              }}
            >
              <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>1</span>
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.1rem",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Search size={20} className="text-primary" />
                お店を探す
              </h3>
              <p
                style={{
                  color: "var(--color-text-sub)",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                地図上でお店を探したり、アレルギー対応で絞り込みができます。
                「卵不使用」「乳不使用」など、お子様に合った条件でフィルタリングしましょう。
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="card fade-in" style={{ animationDelay: "0.2s" }}>
          <div
            style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
          >
            <div
              style={{
                background: "var(--color-primary-light)",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "var(--color-primary)",
              }}
            >
              <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>2</span>
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.1rem",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <ShieldCheck size={20} className="text-primary" />
                安全情報をチェック
              </h3>
              <p
                style={{
                  color: "var(--color-text-sub)",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                各店舗ページでは、アレルギー対応情報、キッズ設備、他のユーザーの口コミを確認できます。
                「公認店舗」マークがあるお店は、オーナー自身が情報を管理しています。
              </p>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="card fade-in" style={{ animationDelay: "0.3s" }}>
          <div
            style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
          >
            <div
              style={{
                background: "var(--color-primary-light)",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "var(--color-primary)",
              }}
            >
              <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>3</span>
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.1rem",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <PenTool size={20} className="text-primary" />
                口コミを投稿
              </h3>
              <p
                style={{
                  color: "var(--color-text-sub)",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                実際に行ったお店の情報を投稿して、他のアレルギーっ子家族を助けましょう！
                「このメニューは卵抜きでできた」など、具体的な情報が喜ばれます。
              </p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="card fade-in" style={{ animationDelay: "0.4s" }}>
          <div
            style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}
          >
            <div
              style={{
                background: "var(--color-primary-light)",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "var(--color-primary)",
              }}
            >
              <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>4</span>
            </div>
            <div>
              <h3
                style={{
                  fontSize: "1.1rem",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Bookmark size={20} color="#FB923C" />
                お気に入り保存
              </h3>
              <p
                style={{
                  color: "var(--color-text-sub)",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                  marginBottom: "12px",
                }}
              >
                気になるお店は保存して、マイページからいつでも確認できます。
                週末のお出かけ先を事前にリサーチしておきましょう！
              </p>
            </div>
          </div>
        </div>

        {/* Contribution Banner */}
        <div
          className="card fade-in"
          style={{
            animationDelay: "0.5s",
            background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
            border: "2px solid #FB923C",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🤝</div>
          <h3
            style={{
              fontSize: "1.1rem",
              marginBottom: "12px",
              color: "#EA580C",
            }}
          >
            みんなで作る「あんしんマップ」
          </h3>
          <p
            style={{
              color: "var(--color-text-sub)",
              fontSize: "0.85rem",
              lineHeight: "1.6",
            }}
          >
            あなたの投稿が、同じ悩みを持つ家族の助けになります。
            <br />
            一緒に、アレルギーっ子が安心して外食できる社会を作りましょう！
          </p>
        </div>

        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <Link
            href="/map"
            className="btn btn-primary"
            style={{ width: "100%", maxWidth: "300px" }}
          >
            マップを見る
          </Link>
        </div>
      </div>
    </div>
  );
}
