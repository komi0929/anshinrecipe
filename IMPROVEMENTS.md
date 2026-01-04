# 改善ログ

## 2025-12-30 - 感謝を送る機能とお知らせ通知システムの修正

**ステータス**: 🛠️ 開発完了（マイグレーション適用待ち）

**問題点**:
- 「感謝を送る」ボタンをタップすると「送信に失敗しました」エラーが発生
- 感謝通知のタイプ（thanks）が通知一覧で表示されていなかった
- 運営からのおしらせがDBベースの通知システムと連携していなかった

**変更内容**:
- **RLSポリシーの修正**: `auth.role() = 'authenticated'` を `auth.uid() IS NOT NULL` に変更（Supabase v2対応）
- **metadataカラムのサポート**: 通知データにmetadataを含め、絵文字やメッセージを表示可能に
- **thanks通知の表示**: 通知一覧で「🙏 助かりました！」などの感謝メッセージを表示
- **お知らせのDB管理**: announcements テーブルを新規作成し、お知らせをDBで一元管理
- **自動通知機能**: お知らせ追加時に全ユーザーへ通知を自動送信
- **管理画面の拡張**: 「📢 お知らせ管理」タブを追加。お知らせの作成・一覧表示・非表示化が可能
- **announcement通知の表示**: 通知一覧で運営からのおしらせを「📢 運営より: タイトル」形式で表示
- **エラーハンドリング改善**: ThanksButtonでより詳細なエラー情報をログ出力

**関連ファイル**:
- `data/migrations/fix_notifications_rls.sql` (新規)
- `data/migrations/create_announcements_table.sql` (新規)
- `hooks/useNotifications.js` (metadataサポート追加)
- `components/ThanksButton.jsx` (エラーハンドリング改善)
- `app/notifications/page.js` (thanks, announcements表示対応、DB連携)
- `app/api/admin/announcement/route.js` (拡張)
- `app/api/announcements/route.js` (新規 - 公開API)
- `app/admin/page.js` (お知らせ管理タブ追加)

**マイグレーション**:
以下のSQLをSupabase SQL Editorで実行が必要:

1. **通知のRLSポリシー修正**（実行済み）:
```sql
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;
CREATE POLICY "Authenticated users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
```

2. **お知らせテーブル作成**:
```sql
-- data/migrations/create_announcements_table.sql の内容を実行
```

**確認ポイント**:
- [ ] 感謝を送るボタンが正常に動作すること
- [ ] 感謝の通知が「みんなの反応」タブに表示されること
- [ ] 管理画面でお知らせを作成し、全ユーザーに通知が届くこと
- [ ] 「運営からのお知らせ」タブにDBのお知らせが表示されること


## 2025-12-28 - YouTube検索のスマート化とUI統一

**ステータス**: 🚀 本番反映済み

**変更内容**:
- **「結果ゼロ」を防ぐスマート検索**: 検索条件が厳しすぎて結果が出ない場合、自動的に条件（特徴タグ→シーン）を緩和して再検索するロジックを実装（アレルギー除外は維持）。
- **子ども選択UIの統一**: レシピ作成画面と同じ「横長カード・アレルギー表示付き」のデザインに変更。
- **読み込み画面の改善**: 検索中のローディングアニメーションを画面中央に配置。

**関連ファイル**:
- `app/api/youtube/search/route.js`
- `components/ChildSelector.jsx`
- `components/YouTubeSearchOverlay.css`
- `components/YouTubeSearchOverlay.jsx`

**確認ポイント**:
- [x] 子ども選択ボタンが横長のデザインになっていること
- [x] 検索中、スピナーが白いエリアの真ん中に表示されること
- [x] 多くのタグをつけても検索結果が表示されること（フォールバック機能）

## 2025-12-28 - YouTube検索UIの調整（アイコン被り修正・タグ自由入力）

**ステータス**: 🚀 本番反映済み

**変更内容**:
- **検索アイコンの修正**: YouTube検索入力欄でアイコンとテキストが重なる問題を修正。
- **入力項目の必須化**: まだ試していないお子様の選択と、検索キーワードの入力を必須化。
- **特徴タグの自由入力**: プリセット以外の特徴も自由に入力して追加できるように改善。
- **フォーム連携の強化**: 選択したシーン・特徴が正しく親コンポーネント（タグ生成）に渡されるよう修正。

**関連ファイル**:
- `components/RecipeForm.jsx`
- `components/YouTubeSearchOverlay.jsx`
- `components/YouTubeSearchOverlay.css`

**確認ポイント**:
- [x] 検索アイコンがテキストと重ならないこと
- [x] 子どもを選択しないと検索できないこと
- [x] 特徴タグを自由に入力して追加できること

## 2025-12-28 - YouTube検索機能の追加・UI改善

**ステータス**: 🚀 本番反映済み

**変更内容**:
- **YouTube検索機能**: YouTubeからアレルギー対応レシピを検索し、ワンタップでメモに追加できるようになりました。
- **あんしんアルゴリズム**: お子様のアレルギー情報を考慮し、「○○なし」「不使用」などのキーワードを含む動画を優先表示します。
- **シーン・特徴選択**: 「朝ごはん」「お弁当」などのシーン、「簡単」「時短」などの特徴をチップで選択可能。
- **確認ダイアログ**: レシピ追加前に「このレシピをメモに追加しますか？」と確認を表示。
- **デザイン最適化**: 余計な説明文を削除し、ファーストビューで検索ボタンまで表示されるコンパクトなUIに改善。

**関連ファイル**:
- `components/YouTubeSearchOverlay.jsx`
- `components/YouTubeSearchOverlay.css`
- `components/YouTubeRecipeCard.jsx`
- `app/api/youtube/search/route.js`

**確認ポイント**:
- [x] レシピ作成画面から「YouTubeから見つける」ボタンをタップしてオーバーレイが開くこと
- [x] 検索ワードを入力して検索結果が表示されること
- [x] シーン・特徴チップで絞り込みができること
- [x] 「このレシピを追加」から確認ダイアログが表示されること
- [x] 確認後、メモ作成画面にタイトル・画像・URLが自動入力されること

## 2025-12-27 - YouTube検索機能の修正

**ステータス**: 🚀 本番反映済み

**変更内容**:
- **検索ボタンの修正**: YouTube検索オーバーレイ内の検索ボタンがフォーム送信として扱われてしまう不具合を修正（`type="button"`の明示）。
- **Enterキー動作の改善**: 検索ボックスでのEnterキー押下時も正しく検索のみが実行されるよう制御を追加。

**関連ファイル**:
- `components/YouTubeSearchOverlay.jsx`

**確認ポイント**:
- [x] レシピ作成画面からYouTube検索を開き、検索ワードを入力してEnterキーを押してもフォームが送信されないこと
- [x] 「検索」ボタンをクリックして検索結果が表示されること

## 2025-12-27 - グロース施策 Phase 1 & 2 実装

**ステータス**: 🛠️ 開発完了（マイグレーション適用待ち）

### Phase 1: 投稿者へのフィードバック強化

**CelebrationModal（投稿お祝いモーダル）**:
- 紙吹雪・ハートバーストアニメーション
- 「あんしんレシピさん」からの人格化メッセージ
- 初投稿、5/10/25/50件のマイルストーン演出
- 子どもにぴったりのレシピ判定

**ThanksButton（感謝を送る機能）**:
- 5種類の感謝プリセット（🙏助かりました！、💡天才！など）
- レシピ詳細ページに配置
- 通知システムに `thanks` タイプ追加

### Phase 2: コレクション機能 & 子どもの反応評価

**コレクション機能**:
- 保存したレシピをフォルダで整理
- カスタムアイコン・カラー選択
- レシピ詳細ページから直接追加可能

**子どもの反応評価システム**:
- つくレポ投稿時に「完食」「パクパク」「挑戦」「苦戦」を選択可能
- レポートカードに子どもの反応を表示（完食=オレンジなど視覚的に表現）
- 「実際の保護者が認めたレシピ」としての信頼性を可視化

**関連ファイル**:
- `components/CelebrationModal.jsx` (新規)
- `components/ThanksButton.jsx` (新規)
- `components/CollectionCard.jsx` (新規)
- `components/CollectionModal.jsx` (新規)
- `components/AddToCollection.jsx` (新規)
- `hooks/useCollections.js` (新規)
- `app/recipe/new/page.js` (CelebrationModal統合)
- `app/recipe/[id]/RecipeClient.jsx` (ThanksButton・AddToCollection統合)
- `components/NotificationList.jsx` (thanks通知対応)
- `components/TriedReportForm.jsx` (反応入力追加)
- `components/TriedReportCard.jsx` (反応表示追加)
- `lib/actions/socialActions.js` (DB連携)

**マイグレーション**:
- `data/migrations/add_notifications_metadata.sql`
- `data/migrations/create_collections.sql`
- `data/migrations/add_child_reaction.sql`


## 2025-12-20 - 画面遷移の高速化（ローディング画面の削除）

**ステータス**: 🚀 本番反映済み

**変更内容**:
- **ローディング画面の削除**: ページ遷移時に表示されていたロゴ画面（loading.js）を削除し、即時切り替わりを実現。
- **アニメーションの削除**: ページ遷移時のフェードイン効果（template.js）を削除し、サクサクとした操作感へ改善。

**関連ファイル**:
- `app/loading.js` (削除)
- `app/template.js` (削除)

**確認ポイント**:
- [x] ページ遷移時にロゴ画面が出ないこと
- [x] 画面がパッと即座に切り替わること

## 2025-12-18 - 子ども登録・お知らせ・レシピ一覧のUI改善

**ステータス**: 🚀 本番反映済み

**変更内容**:
- **子ども登録画面**: プライバシー注釈を追加（お名前・アイコンがユーザー以外に見えない旨を明記）。
- **プロフィール「お知らせ」セクション**: 3タブ構成（改善予定/改善履歴/お知らせ）のモーダルを追加。
- **レシピ一覧画面**: タブ名を「みんなの投稿」に変更、自分の投稿を除外、新着順/いいね順の並び替えボタンを追加。

**関連ファイル**:
- `app/page.js`
- `app/profile/page.js`

---

## 2025-12-18 - 通知機能とレシピ・検索・プロフィールUIの統合改善

**ステータス**: 🚀 本番反映済み

**変更内容**:
- **通知リストの折りたたみ機能**: 既読の通知を「既読の通知」セクションに収納し、プロフィールの省スペース化を実現。
- **ディープリンク・自動スクロール**: 通知からレシピページへ遷移した際、該当セクション（試してみたレポート等）へ自動でスムーズにスクロールする機能を実装。
- **レシピ投稿画面の改善**: 公開設定のデフォルト化（公開）、保存時の必須チェック、お子様選択に連動したアレルゲンの自動判定ロジック（手動削除可）を導入。
- **レシピ詳細画面の洗練**: 画像のトリミング防止（フルサイズ表示）、タイトルと写真の重なり解消、未設定項目（タグ・シーン）の非表示化、アレルゲン情報の文言明確化。
- **検索UIの修正**: レシピ検索窓のアイコンと文字の重なりを解消（パディングを64pxへ拡大し確実化）。
- **ログイン画面のロールバック**: 新しいオンボーディング体験（WelcomeSlider/Wizard）が期待に沿わなかったため、3つのUSPとイラスト付きの高品質な旧バージョンへ戻しました。
- **公開設定の必須表示**: レシピ追加画面の「公開設定」ラベルに必須マーク（*）を表示。
- **プロフィール画面の調整**: 冗長な「はじめまして」バッジの削除、アプリ内Q&Aセクション（FAQモーダル）の追加。

**関連ファイル**:
- `components/NotificationList.jsx`
- `components/RecipeForm.jsx`
- `components/TriedReportCard.jsx`
- `app/recipe/[id]/RecipeClient.jsx`
- `app/recipe/[id]/RecipeDetailPage.css`
- `app/page.js`
- `app/profile/page.js`

**確認ポイント**:
- [x] 既読の通知が折りたたまれていること
- [x] レポート通知タップで「試してみた」までスクロールすること
- [x] レシピ画像が詳細画面で全体表示されていること
- [x] アレルギー除去情報が「●●なし」と分かりやすく表示されること
- [x] プロフィールにQ&A項目があり、タップで内容が表示されること

## 2025-12-18 - オンボーディング体験の強化

**ステータス**: 🚀 本番反映済み

**変更内容**:
- **ウェルカムスライダー**: 未ログインユーザー向けにアプリの魅力を伝える3ステップのスライダーを実装。
- **セットアップウィザード**: 初回ログイン時に「魔法のパパ・ママ設定」としてお子様情報（名前、アイコン、アレルギー）を対話形式で登録する機能を実装。
- **コーチマーク（機能ガイド）**: 検索入力など特定の機能に対して、初めてのユーザーに使い方を促すガイド表示を追加。

**関連ファイル**:
- `components/WelcomeSlider.jsx`
- `components/OnboardingWizard.jsx`
- `components/CoachMark.jsx`
- `app/page.js`

## 2025-12-17 - レシピ登録とプロフィール設定のUI改善

**ステータス**: 🚀 本番反映済み

**変更内容**:
- 子供登録UIの初期登録画面との統一（アコーディオン表示、アイコン選択肢の拡大）。
- アレルギー登録情報の正確性向上。

**関連ファイル**:
- `app/profile/page.js`
- `components/RecipeForm.jsx`

## 2025-12-16 - LINEログイン不具合修正と詳細ページUI向上

**ステータス**: 🚀 本番反映済み

**変更内容**:
- 既存ユーザーのLINEログイン時にセッションが正しく確立されない問題を修正。
- レシピ詳細ページの文字サイズ拡大、著者情報の視認性向上。

**関連ファイル**:
- `app/api/auth/line/callback/route.js`
- `app/recipe/[id]/page.js`

## 2025-12-12 - パフォーマンス最適化とUX向上

**ステータス**: 🚀 本番反映済み

**変更内容**:
- レシピ登録時のOGP画像取得の高速化（バックグラウンド処理化）。
- ログインLPとホーム画面を統合し、ユーザー体験をスムーズ化。

**関連ファイル**:
- `app/api/ogp/route.js`
- `app/page.js`
