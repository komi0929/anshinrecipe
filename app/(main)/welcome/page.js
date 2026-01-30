import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  ShieldCheck,
  Search,
  Heart,
  Bookmark,
} from "lucide-react";
import "@/app/globals.css";

export default function WelcomePage() {
  return (
    <div className="container" style={{ paddingBottom: "40px" }}>
      {/* Header */}
      <div
        className="page-header"
        style={{ display: "flex", alignItems: "center", gap: "12px" }}
      >
        <Link
          href="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            color: "var(--color-text-sub)",
          }}
        >
          <ArrowLeft size={24} />
        </Link>
        <h1 className="page-title" style={{ marginBottom: 0 }}>
          アプリの使い方
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
            あんしんレシピへようこそ！
          </h2>
          <p
            style={{
              lineHeight: "1.8",
              color: "var(--color-text-main)",
              marginBottom: "24px",
            }}
          >
            このアプリは、食物アレルギーを持つお子様のために、
            <strong>「家族みんなで安心して食べられる」</strong>
            レシピを見つけるための場所です。
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
                <UserPlus size={20} className="text-primary" />
                お子様を登録
              </h3>
              <p
                style={{
                  color: "var(--color-text-sub)",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                まずはマイページから、お子様のアレルギー情報を登録しましょう。
                登録すると、アプリが自動的にレシピの安全性をチェックしてくれます。
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
                安全性をチェック
              </h3>
              <p
                style={{
                  color: "var(--color-text-sub)",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                ホーム画面には、登録したお子様が食べられるレシピが優先的に表示されます。
                写真の左下に、そのレシピが食べられるお子様のアイコンが表示されるので一目でわかります。
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
                <Search size={20} className="text-primary" />
                お子様で絞り込み
              </h3>
              <p
                style={{
                  color: "var(--color-text-sub)",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                画面上部のお子様アイコンをタップすると、その子が食べられるレシピだけを表示できます。
                「シーン」フィルターを使えば、お弁当やパーティなど、目的に合わせた検索も可能です。
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
                <Heart size={20} color="#F43F5E" />
                いいね & 保存
                <Bookmark size={20} color="#FB923C" />
              </h3>
              <p
                style={{
                  color: "var(--color-text-sub)",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                  marginBottom: "12px",
                }}
              >
                <strong>ハート (いいね)</strong>：<br />
                「美味しそう！」「作ってみたい！」という応援の気持ちを伝えましょう。
              </p>
              <p
                style={{
                  color: "var(--color-text-sub)",
                  fontSize: "0.9rem",
                  lineHeight: "1.6",
                }}
              >
                <strong>しおり (保存)</strong>：<br />
                気に入ったレシピは保存して、マイページの「保存」タブからいつでも見返せます。
              </p>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <Link
            href="/"
            className="btn btn-primary"
            style={{ width: "100%", maxWidth: "300px" }}
          >
            さっそくはじめる
          </Link>
        </div>
      </div>
    </div>
  );
}
