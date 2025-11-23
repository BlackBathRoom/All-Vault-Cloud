#!/bin/bash

# API エンドポイントテストスクリプト
# 使い方: ./test-api-endpoint.sh

API_BASE="https://24bdzijg8k.execute-api.ap-northeast-1.amazonaws.com"

echo "=================================================="
echo "🚀 API エンドポイントテスト"
echo "=================================================="
echo ""

# カラー出力用
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: 全ドキュメント取得
echo "📝 Test 1: GET /documents (全ドキュメント)"
echo "---"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/documents")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ ステータス: ${http_code}${NC}"
    echo "📦 レスポンス:"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ ステータス: ${http_code}${NC}"
    echo "エラー: $body"
fi

echo ""
echo "=================================================="
echo ""

# Test 2: FAXドキュメントのみ取得
echo "📝 Test 2: GET /documents?type=fax"
echo "---"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/documents?type=fax")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ ステータス: ${http_code}${NC}"
    echo "📦 レスポンス:"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ ステータス: ${http_code}${NC}"
    echo "エラー: $body"
fi

echo ""
echo "=================================================="
echo ""

# Test 3: メールドキュメントのみ取得
echo "📝 Test 3: GET /documents?type=email_body"
echo "---"
response=$(curl -s -w "\n%{http_code}" "${API_BASE}/documents?type=email_body")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ ステータス: ${http_code}${NC}"
    echo "📦 レスポンス:"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ ステータス: ${http_code}${NC}"
    echo "エラー: $body"
fi

echo ""
echo "=================================================="
echo "✅ テスト完了"
echo "=================================================="
