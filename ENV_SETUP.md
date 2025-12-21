# 環境変数設定ガイド

LINEログイン認証を使用するには、以下の環境変数を`.env.local`ファイルに設定してください。

## 必要な環境変数

### Supabase設定
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### LINE Login設定
```
NEXT_PUBLIC_LINE_CHANNEL_ID=your_line_channel_id_here
LINE_CHANNEL_SECRET=your_line_channel_secret_here
```

### LINE Bot設定（Messaging API）
```
LINE_BOT_CHANNEL_SECRET=your_line_bot_channel_secret_here
LINE_BOT_CHANNEL_ACCESS_TOKEN=your_line_bot_access_token_here
```

### アプリケーションURL
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 取得方法

### Supabase
1. [Supabase Dashboard](https://app.supabase.com/)にアクセス
2. プロジェクトを選択
3. 「Settings」→「API」で以下を確認:
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon public
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role (⚠️ 秘密鍵なので注意)

### LINE Developers (LINE Login)
1. [LINE Developers Console](https://developers.line.biz/console/)にアクセス
2. LINE Loginチャネルを選択
3. 「Basic settings」タブで以下を確認:
   - `NEXT_PUBLIC_LINE_CHANNEL_ID`: Channel ID
   - `LINE_CHANNEL_SECRET`: Channel secret

### LINE Developers (Messaging API Bot)
1. LINE Developers Consoleで**新しいチャネル**を作成（種類: Messaging API）
2. 「Basic settings」タブで:
   - `LINE_BOT_CHANNEL_SECRET`: Channel secret
3. 「Messaging API」タブで:
   - `LINE_BOT_CHANNEL_ACCESS_TOKEN`: Channel access token（発行ボタンで生成）
4. 「Webhook settings」で:
   - Webhook URL: `https://your-domain.com/api/line-bot/webhook`
   - Use webhook: ON

## コールバックURL設定

LINE Developers Consoleで以下のコールバックURLを設定してください:

- 開発環境: `http://localhost:3000/auth/callback/line`
- 本番環境: `https://your-domain.com/auth/callback/line`

設定場所: チャネル → 「LINE Login」タブ → 「Callback URL」

