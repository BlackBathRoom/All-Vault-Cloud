"""
Lambda関数: 文書タグ管理API
- PATCH /documents/{id}/tags - タグ更新
- POST /documents/{id}/classify - AI自動分類
"""
import json
import boto3
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
bedrock_runtime = boto3.client('bedrock-runtime', region_name='ap-northeast-1')
s3_client = boto3.client('s3')

TABLE_NAME = os.environ.get('TABLE_NAME', 'Documents')
BUCKET_NAME = os.environ.get('BUCKET_NAME', 'avc-system')

table = dynamodb.Table(TABLE_NAME)

# Decimal型をJSONシリアライズ可能にする
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    print('📨 Event:', json.dumps(event))
    
    http_method = event.get('requestContext', {}).get('http', {}).get('method')
    path = event.get('requestContext', {}).get('http', {}).get('path', '')
    
    # パスからドキュメントIDを抽出
    path_parts = path.strip('/').split('/')
    if len(path_parts) < 2:
        return error_response(400, 'Invalid path')
    
    doc_id = path_parts[1]
    
    try:
        if http_method == 'PATCH' and path.endswith('/tags'):
            return handle_update_tags(doc_id, event)
        elif http_method == 'POST' and path.endswith('/classify'):
            return handle_classify(doc_id, event)
        else:
            return error_response(404, 'Not Found')
    except Exception as e:
        print(f'❌ Error: {str(e)}')
        import traceback
        traceback.print_exc()
        return error_response(500, str(e))

def handle_update_tags(doc_id, event):
    """タグ更新処理"""
    body = json.loads(event.get('body', '{}'))
    
    update_expr = []
    expr_names = {}
    expr_values = {}
    
    if 'tags' in body:
        update_expr.append('#tags = :tags')
        expr_names['#tags'] = 'tags'
        expr_values[':tags'] = body['tags']
    
    if 'folder' in body:
        update_expr.append('#folder = :folder')
        expr_names['#folder'] = 'folder'
        expr_values[':folder'] = body['folder']
    
    if 'category' in body:
        update_expr.append('#category = :category')
        expr_names['#category'] = 'category'
        expr_values[':category'] = body['category']
    
    if not update_expr:
        return error_response(400, 'No fields to update')
    
    # 更新日時を追加
    from datetime import datetime
    update_expr.append('#updatedAt = :updatedAt')
    expr_names['#updatedAt'] = 'updatedAt'
    expr_values[':updatedAt'] = datetime.utcnow().isoformat() + 'Z'
    
    response = table.update_item(
        Key={'id': doc_id},
        UpdateExpression='SET ' + ', '.join(update_expr),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
        ReturnValues='ALL_NEW'
    )
    
    return success_response(response['Attributes'])

def handle_classify(doc_id, event):
    """AI自動分類処理"""
    # 1. DynamoDBからドキュメント情報取得
    response = table.get_item(Key={'id': doc_id})
    if 'Item' not in response:
        return error_response(404, 'Document not found')
    
    document = response['Item']
    
    # 2. テキスト取得（extractedText または S3から）
    text_content = None
    if 'extractedText' in document and document['extractedText']:
        text_content = document['extractedText']
    elif 's3Key' in document:
        # S3からテキストを取得
        text_key = document['s3Key'].replace('/pdf/', '/text/').replace('.pdf', '.txt')
        try:
            s3_response = s3_client.get_object(Bucket=BUCKET_NAME, Key=text_key)
            text_content = s3_response['Body'].read().decode('utf-8')
        except Exception as e:
            print(f'⚠️ S3テキスト取得失敗: {str(e)}')
    
    if not text_content:
        return error_response(400, 'No text content available for classification')
    
    # 3. Bedrockで分類
    classification = classify_with_bedrock(text_content)
    
    # 4. DynamoDBを更新
    from datetime import datetime
    response = table.update_item(
        Key={'id': doc_id},
        UpdateExpression='SET tags = :tags, category = :category, classificationConfidence = :confidence, updatedAt = :updatedAt',
        ExpressionAttributeValues={
            ':tags': classification['tags'],
            ':category': classification['category'],
            ':confidence': Decimal(str(classification['confidence'])),
            ':updatedAt': datetime.utcnow().isoformat() + 'Z'
        },
        ReturnValues='ALL_NEW'
    )
    
    result = response['Attributes']
    result['classification'] = classification
    result['message'] = '自動分類が完了しました'
    
    return success_response(result)

def classify_with_bedrock(text):
    """Bedrockで文書を分類"""
    
    # テキストを最初の3000文字に制限
    text_sample = text[:3000] if len(text) > 3000 else text
    
    prompt = f"""以下の文書を分析し、適切なタグとカテゴリを日本語で提案してください。

利用可能なタグ（複数選択可）:
- important: 重要
- urgent: 緊急
- invoice: 請求書
- contract: 契約書
- report: 報告書
- meeting: 議事録
- personal: 個人文書
- financial: 財務関連
- legal: 法務関連
- administrative: 管理文書

利用可能なカテゴリ（1つ選択）:
- invoice: 請求書
- order: 発注書
- contract: 契約書
- report: 報告書
- notice: 通知書
- receipt: 領収書
- estimate: 見積書
- other: その他

文書内容:
{text_sample}

以下のJSON形式で回答してください（必ずこの形式で）:
{{
  "tags": ["tag1", "tag2"],
  "category": "category_name",
  "confidence": 0.85,
  "reasoning": "分類理由の簡潔な説明"
}}"""

    try:
        response = bedrock_runtime.invoke_model(
            modelId='anthropic.claude-3-5-sonnet-20241022-v2:0',
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000,
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.3
            })
        )
        
        response_body = json.loads(response['body'].read())
        result_text = response_body['content'][0]['text']
        
        # JSON部分を抽出
        import re
        json_match = re.search(r'\{[\s\S]*\}', result_text)
        if json_match:
            classification = json.loads(json_match.group())
            return classification
        else:
            print(f'⚠️ JSON形式が見つかりません: {result_text}')
            return {
                'tags': ['other'],
                'category': 'other',
                'confidence': 0.5,
                'reasoning': 'AI分類に失敗しました'
            }
    
    except Exception as e:
        print(f'❌ Bedrock呼び出しエラー: {str(e)}')
        return {
            'tags': ['other'],
            'category': 'other',
            'confidence': 0.0,
            'reasoning': f'エラー: {str(e)}'
        }

def success_response(data):
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps(data, cls=DecimalEncoder, ensure_ascii=False)
    }

def error_response(status_code, message):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': message}, ensure_ascii=False)
    }
