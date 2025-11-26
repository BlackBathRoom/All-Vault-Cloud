import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

const bedrock = new BedrockRuntimeClient({ region: 'ap-northeast-1' })
const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' })

const CLASSIFICATION_PROMPT = `
あなたは文書分類の専門家です。以下の文書内容を分析して、適切なタグとカテゴリを提案してください。

【利用可能なタグ】
- important: 重要な文書
- urgent: 緊急対応が必要
- invoice: 請求書・支払い関連
- order: 注文書・発注関連
- contract: 契約書
- payment: 支払い関連
- internal: 社内文書
- customer: 顧客関連
- supplier: 取引先関連
- archived: アーカイブ済み

【利用可能なカテゴリ】
- invoice: 請求書
- order: 注文書
- contract: 契約書
- quotation: 見積書
- receipt: 領収書
- notification: 通知
- internal: 社内文書
- other: その他

【文書内容】
{DOCUMENT_TEXT}

【指示】
1. 文書の内容から最も適切なタグを3つまで選んでください
2. 文書の種類を示すカテゴリを1つ選んでください
3. 分類の信頼度を0.0〜1.0で評価してください
4. 必ずJSON形式で回答してください

【出力形式】
{
  "tags": ["tag1", "tag2", "tag3"],
  "category": "invoice",
  "confidence": 0.95,
  "reasoning": "この文書は請求書の特徴を持ち..."
}
`

export interface ClassificationResult {
    tags: string[]
    category: string
    confidence: number
    reasoning?: string
}

/**
 * Bedrockを使って文書を分類
 */
export async function classifyDocument(documentText: string): Promise<ClassificationResult> {
    try {
        const prompt = CLASSIFICATION_PROMPT.replace('{DOCUMENT_TEXT}', documentText)

        const response = await bedrock.send(
            new InvokeModelCommand({
                modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    anthropic_version: 'bedrock-2023-05-31',
                    max_tokens: 1000,
                    temperature: 0.3,
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                }),
            })
        )

        const responseBody = JSON.parse(new TextDecoder().decode(response.body))
        const content = responseBody.content[0].text

        // JSON部分を抽出
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            throw new Error('Invalid response format from Bedrock')
        }

        const result: ClassificationResult = JSON.parse(jsonMatch[0])

        // バリデーション
        if (!Array.isArray(result.tags) || !result.category) {
            throw new Error('Invalid classification result')
        }

        return result
    } catch (error) {
        console.error('Bedrock classification error:', error)
        throw error
    }
}

/**
 * S3からテキストを取得してBedrock分類
 */
export async function classifyDocumentFromS3(
    bucketName: string,
    s3Key: string
): Promise<ClassificationResult> {
    try {
        const response = await s3.send(
            new GetObjectCommand({
                Bucket: bucketName,
                Key: s3Key,
            })
        )

        const text = await response.Body?.transformToString('utf-8')
        if (!text) {
            throw new Error('Could not read text from S3')
        }

        return classifyDocument(text)
    } catch (error) {
        console.error('S3 text retrieval error:', error)
        throw error
    }
}
