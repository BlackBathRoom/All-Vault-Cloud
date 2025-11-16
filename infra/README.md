# AWS CDK Infrastructure

このディレクトリには、FAX・メール・クラウドシステムのAWSインフラストラクチャを定義するCDKコードが含まれています。

## セットアップ

```bash
npm install
```

## デプロイ

```bash
# ビルド
npm run build

# 差分確認
npm run diff

# デプロイ
npm run deploy
```

## リソース

- S3 Buckets: ドキュメントストレージ、FAXストレージ
- DynamoDB: ドキュメントメタデータテーブル
- Lambda Functions: OCR処理、メール受信、API処理、メール送信
- API Gateway: RESTful API
- SES: メール送受信

## 注意事項

- デプロイ前に `SENDER_EMAIL` を適切なメールアドレスに変更してください
- SESのサンドボックスモードから本番モードへの移行が必要な場合があります
