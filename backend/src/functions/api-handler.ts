// backend/src/functions/api-handler.ts

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { dynamoClient } from '../lib/dynamoClient'
import { generatePresignedUrl } from '../lib/presignedUrl'
import { Document } from '../lib/types'   // ここ重要★

const TABLE_NAME = process.env.TABLE_NAME || ''
const BUCKET_NAME = process.env.BUCKET_NAME || ''

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

    try {
        // -----------------------
        // GET /documents/{id} (詳細 - 先にチェック)
        // -----------------------
        if (method === 'GET' && path.startsWith('/documents/') && path !== '/documents') {
            const id = path.split('/')[2]

            if (!id) {
                return {
                    statusCode: 400,
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
                    headers: { 'Content-Type': 'application/json' },
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
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
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
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
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
                    body: JSON.stringify({ message: 'Body is required' }),
                }
            }

            const body = JSON.parse(event.body) as {
                fileName?: string
                contentType?: string
            }

            if (!body.fileName || !body.contentType) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'fileName and contentType required' }),
                }
            }

            const key = `fax/${Date.now()}-${body.fileName}`

            const url = await generatePresignedUrl(
                BUCKET_NAME,
                key,
                body.contentType
            )

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, key }),
            }
        }

        return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Not Found' }),
        }
    } catch (err) {
        console.error(err)

        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Internal Server Error',
                error: String(err),
            }),
        }
    }
}
