#!/bin/bash
# Lambda関数のコードを直接更新するスクリプト

FUNCTION_NAME="FaxMailCloudStack-ApiHandlerFunction"  # 実際の関数名に変更してください
REGION="ap-northeast-1"

echo "🔨 Building Lambda function..."
cd /home/itsuki/All-Vault-Cloud/backend
npm run build

echo "📦 Creating deployment package..."
cd dist/functions
zip -r api-handler.zip api-handler.js

echo "🚀 Updating Lambda function: $FUNCTION_NAME"
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file fileb://api-handler.zip \
  --region "$REGION"

if [ $? -eq 0 ]; then
    echo "✅ Lambda function updated successfully!"
else
    echo "❌ Failed to update Lambda function"
    echo "Please make sure AWS credentials are configured:"
    echo "  aws configure"
fi

rm api-handler.zip
