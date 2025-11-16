# All-Vault-Cloud

All-Vault-Cloud/           # リポジトリルート
├─ README.md                     # プロジェクト概要
├─ package.json                  # ルート（ワークスペース管理用にしてもOK）
├─ pnpm-lock.yaml / package-lock.json
├─ .gitignore
├─ .env.example                  # 共通で使う環境変数サンプル（フロントは別管理でも可）
├─ docs/                         # ドキュメント系
│   ├─ requirements.md           # 要件定義書
│   ├─ design.md                 # 設計書
│   └─ architecture.puml         # PlantUMLファイル
│
├─ frontend/                     # フロントエンド(React+Vite+TS)
│   ├─ index.html
│   ├─ package.json
│   ├─ tsconfig.json
│   ├─ vite.config.ts
│   ├─ src/
│   │   ├─ main.tsx
│   │   ├─ App.tsx
│   │   ├─ components/
│   │   │   ├─ layout/
│   │   │   │   ├─ Header.tsx
│   │   │   │   └─ Sidebar.tsx
│   │   │   ├─ documents/
│   │   │   │   ├─ DocumentList.tsx          # 一覧画面
│   │   │   │   ├─ DocumentFilter.tsx        # 種別フィルタなど
│   │   │   │   └─ DocumentDetail.tsx        # 詳細表示
│   │   │   ├─ fax/
│   │   │   │   └─ FaxUploadForm.tsx         # FAXアップロードUI
│   │   │   └─ emails/
│   │   │       └─ EmailSendModal.tsx        # メール送信モーダル
│   │   ├─ pages/
│   │   │   ├─ HomePage.tsx                  # ダッシュボード
│   │   │   ├─ DocumentsPage.tsx             # 文書一覧ページ
│   │   │   └─ FaxUploadPage.tsx             # FAXアップロードページ
│   │   ├─ api/
│   │   │   ├─ client.ts                     # fetchラッパ/axiosなど
│   │   │   ├─ documentsApi.ts               # /documents 系
│   │   │   ├─ uploadsApi.ts                 # /uploads/presigned-url
│   │   │   └─ emailsApi.ts                  # /emails/send
│   │   ├─ types/
│   │   │   └─ document.ts                   # Document型定義
│   │   └─ styles/
│   │       └─ global.css
│   └─ public/
│       └─ favicon.ico
│
├─ backend/                      # Lambda用バックエンド（Node.js + TS）
│   ├─ package.json
│   ├─ tsconfig.json
│   ├─ src/
│   │   ├─ functions/
│   │   │   ├─ image-ocr.ts                 # ImageOCRFunction
│   │   │   ├─ mail-ingest.ts               # MailIngestFunction
│   │   │   ├─ api-handler.ts               # ApiHandlerFunction
│   │   │   └─ mail-send.ts                 # MailSendFunction
│   │   ├─ lib/
│   │   │   ├─ s3Client.ts                  # S3クライアント共通
│   │   │   ├─ dynamoClient.ts             # DynamoDBクライアント共通
│   │   │   ├─ sesClient.ts                # SESクライアント
│   │   │   ├─ textractClient.ts           # Textractクライアント
│   │   │   ├─ types.ts                    # Document型など共通型
│   │   │   ├─ mailParser.ts               # EML解析ロジック
│   │   │   └─ presignedUrl.ts             # 署名付きURL生成処理
│   │   └─ config/
│   │       └─ env.ts                      # 環境変数読み込み
│   └─ dist/                               # ビルド成果物（CDKがここを参照）
│
├─ infra/                         # AWS CDK（TypeScript）
│   ├─ bin/
│   │   └─ fax-mail-cloud-system.ts       # エントリーポイント
│   ├─ lib/
│   │   └─ fax-mail-cloud-stack.ts        # メインのStack
│   ├─ package.json
│   ├─ cdk.json
│   ├─ tsconfig.json
│   └─ README.md
│
└─ .github/
    └─ workflows/
        ├─ ci-frontend.yml                # フロントのビルド/テスト
        ├─ ci-backend.yml                 # バックのビルド/テスト
        └─ cdk-deploy.yml                 # CDKデプロイ（任意）
