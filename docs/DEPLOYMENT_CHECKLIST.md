# デプロイ前チェックリスト

このファイルは、infraをデプロイする前に必要な準備と設定を確認するためのチェックリストです。

## ✅ 必須準備項目

### 1. AWS認証情報

- [ ] AWS CLIがインストール済み
- [ ] AWS認証情報が設定済み（以下のいずれか）
  - AWS CLIプロファイル (`aws configure`)
  - 環境変数 (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
  - IAMロール（EC2/ECS等で実行する場合）

確認コマンド:
```bash
aws sts get-caller-identity
```

### 2. 必要なAWS権限

デプロイを実行するIAMユーザー/ロールに以下の権限が必要です：

- [ ] CloudFormation（フルアクセス）
- [ ] S3（フルアクセス）
- [ ] DynamoDB（フルアクセス）
- [ ] Lambda（フルアクセス）
- [ ] API Gateway（フルアクセス）
- [ ] SES（フルアクセス）
- [ ] IAM（ロール・ポリシー作成）
- [ ] CloudWatch Logs（ロググループ作成）

### 3. SESメールアドレス検証

**重要**: SESでメール送信元アドレスを事前に検証する必要があります。

#### 検証手順:

1. AWSコンソール → Amazon SES → Verified identities
2. "Create identity" をクリック
3. Email addressを選択し、送信元として使用するメールアドレスを入力
4. 検証メールが届くので、リンクをクリックして検証完了

または、AWS CLIで実行:
```bash
aws ses verify-email-identity --email-address your-email@example.com
```

検証状態の確認:
```bash
aws ses get-identity-verification-attributes --identities your-email@example.com
```

- [ ] SESメールアドレスが検証済み（Status: Success）

### 4. SESサンドボックスモード（本番環境の場合）

**注意**: デフォルトでSESはサンドボックスモードです。本番環境で使用する場合は解除が必要です。

サンドボックスモードの制限:
- 検証済みメールアドレスにのみ送信可能
- 1日200通、1秒1通の制限

本番環境への移行:
1. AWSコンソール → Amazon SES → Account dashboard
2. "Request production access" をクリック
3. 申請フォームを記入して送信（通常24時間以内に承認）

- [ ] 本番環境の場合：SESサンドボックスモード解除済み
- [ ] 開発環境の場合：サンドボックスモードのまま（検証済みアドレスのみ使用）

### 5. backendのビルド

infraはbackendのビルド済みファイル (`backend/dist/`) を参照します。

```bash
cd backend
npm install
npm run build
```

確認:
```bash
ls -la backend/dist/functions/
# image-ocr.js, mail-ingest.js, api-handler.js, mail-send.js が存在すること
```

- [ ] `backend/dist/functions/` にすべてのLambda関数がビルド済み

### 6. Node.js バージョン

- [ ] Node.js 20.x 以上がインストール済み

確認コマンド:
```bash
node --version  # v20.x.x 以上
```

### 7. CDK Bootstrap（初回のみ）

CDKを初めて使用するアカウント/リージョンでは、Bootstrapが必要です。

```bash
cd infra
npm run cdk bootstrap
```

- [ ] CDK Bootstrap実行済み（初回のみ必要）

## 📝 設定項目

### 1. SES送信元メールアドレスの設定

`infra/lib/fax-mail-cloud-stack.ts` の147行目付近:

```typescript
SENDER_EMAIL: 'noreply@example.com',  // ← 検証済みメールアドレスに変更
```

- [ ] `SENDER_EMAIL` を検証済みアドレスに変更済み

### 2. リージョンの確認

デフォルトは `ap-northeast-1` (東京) です。変更する場合:

`infra/bin/fax-mail-cloud-system.ts`:
```typescript
env: {
    region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
}
```

- [ ] デプロイ先リージョンを確認済み

## 🚀 デプロイ実行

### 1. 差分確認（推奨）

```bash
cd infra
npm run diff
```

### 2. デプロイ

```bash
npm run deploy
```

### 3. デプロイ後の確認

デプロイが完了すると、以下の出力が表示されます：

```
Outputs:
FaxMailCloudStack.ApiUrl = https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/
FaxMailCloudStack.FaxSystemBucketName = fax-system-123456789012
FaxMailCloudStack.DocumentsTableName = Documents
```

これらの値を控えておき、frontendの設定に使用します。

- [ ] デプロイ完了
- [ ] 出力値（ApiUrl, BucketName, TableName）を記録

## 🔍 デプロイ後の動作確認

### 1. S3バケットの確認

```bash
aws s3 ls fax-system-{your-account-id}
```

### 2. DynamoDBテーブルの確認

```bash
aws dynamodb describe-table --table-name Documents
```

### 3. Lambda関数の確認

```bash
aws lambda list-functions --query 'Functions[?contains(FunctionName, `FaxMail`)].FunctionName'
```

### 4. API Gatewayのテスト

```bash
curl https://your-api-id.execute-api.ap-northeast-1.amazonaws.com/prod/documents
```

- [ ] すべてのリソースが正常に作成されている

## 🐛 トラブルシューティング

### エラー: "Email address is not verified"

→ SESでメールアドレスの検証が必要です（上記「3. SESメールアドレス検証」参照）

### エラー: "Cannot find module 'backend/dist/functions/xxx.js'"

→ backendのビルドが必要です:
```bash
cd backend && npm run build && cd ../infra
```

### エラー: "CDK bootstrap required"

→ 初回デプロイ時はbootstrapが必要です:
```bash
npm run cdk bootstrap
```

### エラー: "Insufficient permissions"

→ デプロイを実行するIAMユーザー/ロールに必要な権限が不足しています。上記「2. 必要なAWS権限」を確認してください。

## 📞 サポート

問題が解決しない場合は、以下の情報を含めて報告してください：

- エラーメッセージ全文
- 実行したコマンド
- AWSリージョン
- Node.jsバージョン
- AWS CLIバージョン (`aws --version`)
