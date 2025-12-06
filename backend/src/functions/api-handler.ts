// backend/src/functions/api-handler.ts

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamoClient } from '../lib/dynamoClient'
import { generatePresignedUrl } from '../lib/presignedUrl'
import { classifyDocumentFromS3 } from '../lib/bedrockClassifier'
import { Document } from '../lib/types'   // ここ重要★

const TABLE_NAME = process.env.TABLE_NAME || ''
const BUCKET_NAME = process.env.BUCKET_NAME || ''

// CORS ヘッダー定義
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',  // CloudFront経由なので * で許可
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}

// Document 型ガード（type-safety）
function isDocument(item: unknown): item is Document {
    if (typeof item !== 'object' || item === null) return false
    const obj = item as Record<string, unknown>

    return (
        typeof obj.id === 'string' &&
        typeof obj.type === 'string' &&
        typeof obj.createdAt === 'string'
    )
}

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    console.log('ApiHandler invoked:', JSON.stringify(event))
    console.log('Environment variables:', {
        TABLE_NAME,
        BUCKET_NAME,
        AWS_REGION: process.env.AWS_REGION
    })

    const { httpMethod: method, path } = event

    // プリフライトリクエスト (OPTIONS) の処理
    if (method === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'CORS preflight successful' }),
        }
    }

    try {
        // -----------------------
        // GET /documents/{id} (詳細 - 先にチェック)
        // -----------------------
        if (method === 'GET' && path.startsWith('/documents/') && path !== '/documents') {
            const id = path.split('/')[2]

            if (!id) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: 'Invalid document id' }),
                }
            }

            const getCommand = new GetCommand({
                TableName: TABLE_NAME,
                Key: { id },
            })

            const result = await dynamoClient.send(getCommand)

            if (!result.Item || !isDocument(result.Item)) {
                return {
                    statusCode: 404,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: 'Document not found' }),
                }
            }

            const item: Document = result.Item

            // PDF presigned URL（必要な場合のみ）
            let pdfUrl: string | null = null
            if (item.s3Key) {
                try {
                    pdfUrl = await generatePresignedUrl(
                        BUCKET_NAME,
                        item.s3Key,
                        'application/pdf'
                    )
                } catch (e) {
                    console.error('PDF URL generation failed:', e)
                }
            }

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ ...item, pdfUrl }),
            }
        }

        // -----------------------
        // GET /documents (一覧)
        // -----------------------
        if (method === 'GET' && path === '/documents') {
            const type = event.queryStringParameters?.type

            const scanCommand = new ScanCommand({
                TableName: TABLE_NAME,
                FilterExpression: type ? '#type = :type' : undefined,
                ExpressionAttributeNames: type ? { '#type': 'type' } : undefined,
                ExpressionAttributeValues: type ? { ':type': type } : undefined,
            })

            const result = await dynamoClient.send(scanCommand)

            const items = (result.Items ?? []).filter(isDocument)

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify(items),
            }
        }

        // -----------------------
        // POST /uploads/presigned-url
        // -----------------------
        if (method === 'POST' && path === '/uploads/presigned-url') {
            if (!event.body) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: 'Body is required' }),
                }
            }

            const body = JSON.parse(event.body) as {
                fileName?: string
                fileType?: string
                contentType?: string
            }

            const contentType = body.fileType || body.contentType

            if (!body.fileName || !contentType) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: 'fileName and fileType (or contentType) required' }),
                }
            }

            const key = `fax/${Date.now()}-${body.fileName}`

            const url = await generatePresignedUrl(
                BUCKET_NAME,
                key,
                contentType
            )

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ url, key }),
            }
        }

        // -----------------------
        // PATCH /documents/{id}/tags (タグ更新)
        // -----------------------
        if (method === 'PATCH' && path.match(/^\/documents\/[^/]+\/tags$/)) {
            const id = path.split('/')[2]

            if (!id || !event.body) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: 'Invalid request' }),
                }
            }

            const body = JSON.parse(event.body) as {
                tags?: string[]
                folder?: string
                category?: string
            }

            const updateExpression: string[] = []
            const expressionAttributeNames: Record<string, string> = {}
            const expressionAttributeValues: Record<string, unknown> = {}

            if (body.tags !== undefined) {
                updateExpression.push('#tags = :tags')
                expressionAttributeNames['#tags'] = 'tags'
                expressionAttributeValues[':tags'] = body.tags
            }

            if (body.folder !== undefined) {
                updateExpression.push('#folder = :folder')
                expressionAttributeNames['#folder'] = 'folder'
                expressionAttributeValues[':folder'] = body.folder
            }

            if (body.category !== undefined) {
                updateExpression.push('#category = :category')
                expressionAttributeNames['#category'] = 'category'
                expressionAttributeValues[':category'] = body.category
            }

            if (updateExpression.length === 0) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: 'No fields to update' }),
                }
            }

            updateExpression.push('#updatedAt = :updatedAt')
            expressionAttributeNames['#updatedAt'] = 'updatedAt'
            expressionAttributeValues[':updatedAt'] = new Date().toISOString()

            const { UpdateCommand } = await import('@aws-sdk/lib-dynamodb')
            const updateCommand = new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { id },
                UpdateExpression: `SET ${updateExpression.join(', ')}`,
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: expressionAttributeValues,
                ReturnValues: 'ALL_NEW',
            })

            const result = await dynamoClient.send(updateCommand)

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify(result.Attributes),
            }
        }

        // -----------------------
        // POST /emails/send (メール送信)
        // -----------------------
        if (method === 'POST' && path === '/emails/send') {
            if (!event.body) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: 'Body is required' }),
                }
            }

            const body = JSON.parse(event.body) as {
                to?: string
                subject?: string
                body?: string
            }

            if (!body.to || !body.subject || !body.body) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ 
                        message: 'Missing required fields: to, subject, body' 
                    }),
                }
            }

            const SENDER_EMAIL = process.env.SENDER_EMAIL || ''

            const { SendEmailCommand } = await import('@aws-sdk/client-ses')
            const { sesClient } = await import('../lib/sesClient')

            const command = new SendEmailCommand({
                Source: SENDER_EMAIL,
                Destination: {
                    ToAddresses: [body.to],
                },
                Message: {
                    Subject: {
                        Data: body.subject,
                        Charset: 'UTF-8',
                    },
                    Body: {
                        Text: {
                            Data: body.body,
                            Charset: 'UTF-8',
                        },
                    },
                },
            })

            await sesClient.send(command)

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ message: 'Email sent successfully' }),
            }
        }

        // -----------------------
        // POST /documents/{id}/classify (AI自動分類)
        // -----------------------
        if (method === 'POST' && path.match(/^\/documents\/[^/]+\/classify$/)) {
            const id = path.split('/')[2]

            if (!id) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: 'Invalid document id' }),
                }
            }

            // 1. DynamoDBからドキュメント情報を取得
            const getCommand = new GetCommand({
                TableName: TABLE_NAME,
                Key: { id },
            })
            const getResult = await dynamoClient.send(getCommand)

            if (!getResult.Item || !isDocument(getResult.Item)) {
                return {
                    statusCode: 404,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: 'Document not found' }),
                }
            }

            const document = getResult.Item

            // 2. textKeyが存在するか確認（OCR済み）
            if (!document.extractedText && !document.s3Key) {
                return {
                    statusCode: 400,
                    headers: corsHeaders,
                    body: JSON.stringify({ 
                        message: 'Document does not have text content. Please ensure OCR has been performed.' 
                    }),
                }
            }

            // 3. Bedrockで分類（extractedTextまたはs3Keyから）
            let classification
            try {
                if (document.extractedText) {
                    const { classifyDocument } = await import('../lib/bedrockClassifier')
                    classification = await classifyDocument(document.extractedText)
                } else {
                    // textKeyがある場合はS3から取得
                    const textKey = document.s3Key.replace('/pdf/', '/text/').replace('.pdf', '.txt')
                    classification = await classifyDocumentFromS3(BUCKET_NAME, textKey)
                }
            } catch (error) {
                console.error('Bedrock classification error:', error)
                return {
                    statusCode: 500,
                    headers: corsHeaders,
                    body: JSON.stringify({ 
                        message: 'AI classification failed',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }),
                }
            }

            // 4. DynamoDBを更新
            const updateCommand = new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { id },
                UpdateExpression:
                    'SET tags = :tags, category = :category, classificationConfidence = :confidence, updatedAt = :updatedAt',
                ExpressionAttributeValues: {
                    ':tags': classification.tags,
                    ':category': classification.category,
                    ':confidence': classification.confidence,
                    ':updatedAt': new Date().toISOString(),
                },
                ReturnValues: 'ALL_NEW',
            })

            const updateResult = await dynamoClient.send(updateCommand)

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                    document: updateResult.Attributes,
                    classification: {
                        ...classification,
                        message: '自動分類が完了しました',
                    },
                }),
            }
        }

        return {
            statusCode: 404,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Not Found' }),
        }
    } catch (err) {
        console.error(err)

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                message: 'Internal Server Error',
                error: String(err),
            }),
        }
    }
}
