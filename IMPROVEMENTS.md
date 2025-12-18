# 改善ログ

## 2025-12-18
- **[Onboarding] オンボーディング機能の強化**: 新規ユーザー向けのウェルカムスライダー、初回ログイン時のセットアップウィザード、機能ガイド（コーチマーク）を実装しました。
    - 関連ファイル: `components/WelcomeSlider.jsx`, `components/OnboardingWizard.jsx`, `components/CoachMark.jsx`, `app/page.js`
- **[UX] レシピ投稿ガイドの追加**: レシピ投稿画面に、URL自動入力機能などを紹介するコーチマークを追加しました。
    - 関連ファイル: `app/recipe/new/page.js`, `components/RecipeForm.jsx`
- **[UX] 挨拶文言の改善**: トップページの挨拶を「〇〇ちゃんママ」から「（ユーザー名）さん」に変更し、より包括的で適切な表現にしました。
    - 関連ファイル: `app/page.js`

## 2025-12-17
- **[Recipe] レシピ登録フォームの改善**: アレルギー情報の自動入力（除去機能）の実装、公開設定の必須化とデフォルト公開への変更。
    - 関連ファイル: `components/RecipeForm.jsx`
- **[Profile] 子供登録UIの改善**: プロフィール設定内の子供登録モーダルを、初回登録画面とUI統一（アコーディオン表示、アイコン選択肢追加）。
    - 関連ファイル: `app/profile/page.js`

## 2025-12-16
- **[Bugfix] LINEログイン不具合修正**: 既存ユーザーがLINEログインできない問題を修正（セッション管理の見直し）。
    - 関連ファイル: `app/api/auth/line/callback/route.js`
- **[UI] レシピ詳細ページの改善**: 画像クロップ修正、著者名フォントサイズ拡大、「説明」→「おすすめポイント」への文言変更、ブックマーク/編集ボタンの追加。
    - 関連ファイル: `app/recipe/[id]/page.js`

## 2025-12-15
- **[Notification] 通知機能の修正**: 通知が正しく表示されない、既読にならない問題を修正。
    - 関連ファイル: `hooks/useNotifications.js`, `components/Header.js`

## 2025-12-12
- **[Performance] 画像読み込み高速化**: OGP画像の取得を非同期化し、レシピ登録時の体感速度を向上。
    - 関連ファイル: `app/api/ogp/route.js`, `components/RecipeForm.jsx`
- **[UI] ログイン画面の統合**: ホーム画面とログインLPを統合し、シームレスな遷移を実現。
    - 関連ファイル: `app/login/page.js` (リダイレクト化), `app/page.js`
