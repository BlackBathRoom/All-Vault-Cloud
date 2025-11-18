# Infrastructure (infra)

このディレクトリは、AWS CDKを使用してFAX・メール・クラウドシステムのインフラストラクチャを定義・管理します。

## 📦 構成

```
infra/
├── bin/
│   └── fax-mail-cloud-system.ts  # CDKアプリケーションのエントリーポイント
├── lib/
│   └── fax-mail-cloud-stack.ts   # スタック定義（AWSリソース）
├── cdk.json                       # CDK設定ファイル
├── package.json                   # 依存関係とスクリプト
└── tsconfig.json                  # TypeScript設定
```

## 🏗️ デプロイされるAWSリソース

### S3バケット
- **fax-system-{account}**: 単一バケットでprefix構造管理
  - `uploads/raw/` - FAX画像アップロード先
  - `uploads/text/` - OCR抽出テキスト
  - `uploads/pdf/` - FAX PDF生成先
  - `ses-raw-mail/` - SES受信メールEML
  - `emails/text/` - メール本文テキスト
  - `docs/email/` - メール添付PDF

### DynamoDB
- **Documents**: ドキュメント管理テーブル
  - Partition Key: `id`
  - GSI: `type-createdAt-index` (type別検索)
  - GSI: `sender-createdAt-index` (送信者別検索)

### Lambda関数
1. **ImageOCRFunction** (1024MB, 5分)
   - トリガー: S3 `uploads/raw/` へのアップロード
   - 処理: Textract OCR → PDF生成 → DynamoDB登録

2. **MailIngestFunction** (512MB, 3分)
   - トリガー: SESメール受信
   - 処理: EML解析 → 添付抽出 → DynamoDB登録

3. **ApiHandlerFunction** (256MB, 30秒)
   - トリガー: API Gateway
   - エンドポイント:
     - `GET /documents` - 一覧取得
     - `GET /documents/{id}` - 詳細取得
     - `POST /uploads/presigned-url` - アップロード用URL生成

4. **MailSendFunction** (256MB, 30秒)
   - トリガー: API Gateway
   - エンドポイント: `POST /emails/send`

### API Gateway
- RESTful API
- CORS有効化
- Lambda統合

### SES
- 受信ルールセット: `fax-mail-receipt-rules`
- アクション: S3保存 → Lambda呼び出し

## 🚀 デプロイ手順

### 1. 前提条件

- AWS CLIがインストール済みで認証設定済み
- Node.js 20.x以上
- backendフォルダーがビルド済み (`backend/dist/` が存在)

### 2. AWS認証情報の設定

```bash
# 環境変数で設定
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_DEFAULT_REGION=ap-northeast-1

# またはAWS CLI profileを使用
export AWS_PROFILE=your-profile-name
```

### 3. 環境変数の設定

デプロイ前に以下の環境変数を確認・設定してください：

- `SENDER_EMAIL`: SESで検証済みのメール送信元アドレス
  - 現在の設定: `noreply@example.com`
  - 変更方法: `lib/fax-mail-cloud-stack.ts` の147行目を編集

### 4. backendのビルド

```bash
cd ../backend
npm run build
cd ../infra
```

### 5. CDK Bootstrap（初回のみ）

```bash
npm run cdk bootstrap
```

### 6. デプロイ

```bash
# 差分確認
npm run diff

# デプロイ実行
npm run deploy
```

デプロイ完了後、以下の情報が出力されます：
- `ApiUrl`: API GatewayのエンドポイントURL
- `FaxSystemBucketName`: S3バケット名
- `DocumentsTableName`: DynamoDBテーブル名

## 🔧 ローカル開発

### スタックのシンセサイズ（CloudFormationテンプレート生成）

```bash
npm run synth
```

### TypeScriptのウォッチモード

```bash
npm run watch
```

### リソースの削除

```bash
cdk destroy
```

⚠️ **注意**: `DESTROY`ポリシーが設定されているため、削除時にS3バケットとDynamoDBテーブルのデータも削除されます。

## 📝 カスタマイズ方法

### SES送信元メールアドレスの変更

`lib/fax-mail-cloud-stack.ts`:
```typescript
SENDER_EMAIL: 'your-verified-email@example.com',
```

### Lambda関数のメモリ・タイムアウト調整

```typescript
memorySize: 1024,  // MB
timeout: cdk.Duration.minutes(5),
```

### リージョンの変更

`bin/fax-mail-cloud-system.ts`:
```typescript
env: {
    region: 'us-east-1',  // 希望のリージョン
}
```

## 🔐 必要なAWS権限

デプロイには以下のAWS権限が必要です：

- CloudFormation（スタック作成・更新・削除）
- S3（バケット作成・管理）
- DynamoDB（テーブル作成・管理）
- Lambda（関数作成・更新）
- API Gateway（API作成・管理）
- SES（受信ルール設定）
- IAM（ロール・ポリシー作成）
- CloudWatch Logs（ロググループ作成）

## 🐛 トラブルシューティング

### エラー: "backend/dist/ が見つかりません"

```bash
cd ../backend
npm run build
cd ../infra
```

### エラー: "SES identity not verified"

SESコンソールでメールアドレスまたはドメインを検証してください：
```bash
aws ses verify-email-identity --email-address your-email@example.com
```

### エラー: "CDK bootstrap が必要です"

```bash
npm run cdk bootstrap aws://{account-id}/ap-northeast-1
```

## 📚 参考リンク

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Amazon SES Setup](https://docs.aws.amazon.com/ses/latest/dg/setting-up.html)
