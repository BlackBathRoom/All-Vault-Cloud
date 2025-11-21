<div align="center">

# 📄 All-Vault-Cloud

**FAX・メール一元管理クラウドシステム**

[![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20S3%20%7C%20DynamoDB-orange?logo=amazon-aws)](https://aws.amazon.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://reactjs.org/)

受信したFAXとメールを一元管理し、OCR処理・PDF変換・返信機能を提供するサーバーレスシステム

[🚀 デモを見る](#) | [📖 ドキュメント](#-api-エンドポイント) | [🐛 バグ報告](https://github.com/BlackBathRoom/All-Vault-Cloud/issues)

</div>

---

## ✨ 主な機能

<table>
<tr>
<td width="50%">

### 📨 FAX管理
- 画像アップロード（署名付きURL）
- 自動OCR処理
- PDF変換・保存
- 一覧表示・検索

</td>
<td width="50%">

### 📧 メール管理
- 受信メール自動取り込み
- 添付ファイル自動抽出
- 返信機能（SES連携）
- 本文・添付の一元管理

</td>
</tr>
</table>

---

## 🏗️ システムアーキテクチャ

```mermaid
graph LR
    A[フロントエンド<br/>React] -->|API Gateway| B[Lambda関数]
    B -->|読み書き| C[(DynamoDB<br/>Documents)]
    B -->|署名付きURL| D[S3 Bucket]
    D -->|S3トリガー| E[OCR Lambda]
    E -->|PDF保存| D
    F[SES] -->|メール受信| D
    D -->|S3トリガー| G[メール解析 Lambda]
    G -->|登録| C
```

---

## 🚀 クイックスタート

### 📋 前提条件

- Node.js 18以上
- AWS アカウント
- AWS CLI 設定済み

### 🎯 フロントエンド起動

```bash
# リポジトリをクローン
git clone https://github.com/BlackBathRoom/All-Vault-Cloud.git
cd All-Vault-Cloud/frontend

# 依存関係をインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス 🎉

---

## 🌐 API エンドポイント

**ベースURL**: `https://24bdzijg8k.execute-api.ap-northeast-1.amazonaws.com`

### 📚 文書管理

<details open>
<summary><b>GET</b> <code>/documents</code> - 文書一覧取得</summary>

#### クエリパラメータ
| パラメータ | 型 | 説明 | 例 |
|-----------|-----|------|-----|
| `type` | string | 文書タイプ（省略可） | `fax`, `email_body`, `email_attachment` |

#### レスポンス例
```json
[
  {
    "id": "b7815804-8d5a-41e9-8eb4-cc914d0618cb",
    "type": "fax",
    "subject": null,
    "from": null,
    "createdAt": "2025-11-19T07:11:41.887Z"
  }
]
```

#### 使用例
```bash
# すべての文書
curl https://24bdzijg8k.execute-api.ap-northeast-1.amazonaws.com/documents

# FAXのみ
curl https://24bdzijg8k.execute-api.ap-northeast-1.amazonaws.com/documents?type=fax
```
</details>
