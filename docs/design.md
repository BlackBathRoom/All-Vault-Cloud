# 設計書

## システムアーキテクチャ

### フロントエンド

- React + TypeScript + Vite
- APIクライアント層による疎結合設計
- コンポーネント駆動開発

### バックエンド

- サーバーレスアーキテクチャ (AWS Lambda)
- イベント駆動アーキテクチャ
- RESTful API

### データモデル

#### Document

```typescript
{
  id: string;              // ドキュメントID
  type: 'fax' | 'email';   // 種別
  subject: string;         // 件名
  sender: string;          // 送信者
  receivedAt: string;      // 受信日時
  s3Key: string;           // S3キー
  extractedText?: string;  // OCR抽出テキスト
  metadata: object;        // その他メタデータ
}
```

## API設計

### エンドポイント

- `GET /documents` - 文書一覧取得
- `GET /documents/:id` - 文書詳細取得
- `POST /uploads/presigned-url` - アップロード用署名付きURL取得
- `POST /emails/send` - メール送信

## Lambda関数

### ImageOCRFunction

- トリガー: S3イベント (FAXアップロード)
- 処理: Textract呼び出し、DynamoDB更新

### MailIngestFunction

- トリガー: SESメール受信
- 処理: EML解析、添付ファイル保存、DynamoDB更新

### ApiHandlerFunction

- トリガー: API Gateway
- 処理: CRUD操作、署名付きURL生成

### MailSendFunction

- トリガー: API Gateway
- 処理: SESによるメール送信

## セキュリティ設計

- IAMロールによる最小権限の原則
- S3バケットポリシーによるアクセス制限
- API Gatewayの認証/認可 (将来的にCognito統合)
