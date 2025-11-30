#!/bin/bash
# 既存のすべてのドキュメントにタグを付けるスクリプト

echo "🔍 タグのないドキュメントを検索中..."

# タグがないドキュメントのIDを取得
DOCUMENT_IDS=$(aws dynamodb scan \
  --table-name Documents \
  --region ap-northeast-1 \
  --filter-expression "attribute_not_exists(tags) OR size(tags) = :zero" \
  --expression-attribute-values '{":zero":{"N":"0"}}' \
  --projection-expression "id" \
  --output text | awk '{print $2}')

if [ -z "$DOCUMENT_IDS" ]; then
  echo "✅ すべてのドキュメントにタグが付いています"
  exit 0
fi

COUNT=$(echo "$DOCUMENT_IDS" | wc -l)
echo "📊 タグのないドキュメント: ${COUNT}件"
echo ""

CURRENT=0
FAILED=0

for DOC_ID in $DOCUMENT_IDS; do
  CURRENT=$((CURRENT + 1))
  echo "[$CURRENT/$COUNT] 📄 ドキュメント: $DOC_ID"
  
  # avc-api-tags Lambda関数を呼び出して分類
  RESULT=$(aws lambda invoke \
    --function-name avc-api-tags \
    --region ap-northeast-1 \
    --payload "{\"requestContext\":{\"http\":{\"method\":\"POST\",\"path\":\"/documents/$DOC_ID/classify\"}},\"pathParameters\":{\"id\":\"$DOC_ID\"}}" \
    --cli-binary-format raw-in-base64-out \
    /tmp/classify-response.json 2>&1)
  
  if [ $? -eq 0 ]; then
    # レスポンスを確認
    if grep -q '"statusCode": *200' /tmp/classify-response.json 2>/dev/null; then
      echo "   ✅ 分類完了"
    else
      echo "   ⚠️  分類失敗"
      FAILED=$((FAILED + 1))
    fi
  else
    echo "   ❌ Lambda呼び出しエラー"
    FAILED=$((FAILED + 1))
  fi
  
  echo ""
  sleep 1  # レート制限を避けるため
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 完了: $COUNT件中$((COUNT - FAILED))件が成功しました"
if [ $FAILED -gt 0 ]; then
  echo "⚠️  失敗: ${FAILED}件"
fi

rm -f /tmp/classify-response.json
