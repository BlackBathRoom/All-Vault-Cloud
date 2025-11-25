import {
    APIGatewayProxyEventV2,
    APIGatewayProxyResultV2,
} from 'aws-lambda'
import {
    PutCommand,
    QueryCommand,
    UpdateCommand,
    DeleteCommand,
} from '@aws-sdk/lib-dynamodb'
import { dynamoClient } from '../lib/dynamoClient'
import { randomUUID } from 'crypto'

const MEMO_TABLE = process.env.MEMO_TABLE || 'DocumentMemos'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
}

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    try {
        const method = event.requestContext.http.method
        const documentId = event.pathParameters?.id
        const memoId = event.pathParameters?.memoId

        if (!documentId) {
            return { statusCode: 400, body: 'documentId is required' }
        }

        // ---------- GET: メモ一覧 ----------
        if (method === 'GET' && !memoId) {
            const res = await dynamoClient.send(
                new QueryCommand({
                    TableName: MEMO_TABLE,
                    KeyConditionExpression: 'documentId = :d',
                    ExpressionAttributeValues: {
                        ':d': documentId,
                    },
                })
            )
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify(res.Items ?? []),
            }
        }

        const body = event.body ? JSON.parse(event.body) : {}

        // ---------- POST: メモ作成 ----------
        if (method === 'POST') {
            const now = new Date().toISOString()
            const newMemoId = randomUUID()

            const item = {
                documentId,
                memoId: newMemoId,
                text: body.text ?? '',
                page: body.page ?? null,
                createdAt: now,
                updatedAt: now,
            }

            await dynamoClient.send(
                new PutCommand({
                    TableName: MEMO_TABLE,
                    Item: item,
                })
            )

            return {
                statusCode: 201,
                headers: corsHeaders,
                body: JSON.stringify(item),
            }
        }

        if (!memoId) {
            return { statusCode: 400, body: 'memoId is required' }
        }

        // ---------- PUT: メモ更新 ----------
        if (method === 'PUT') {
            const now = new Date().toISOString()

            await dynamoClient.send(
                new UpdateCommand({
                    TableName: MEMO_TABLE,
                    Key: { documentId, memoId },
                    UpdateExpression:
                        'SET #t = :t, updatedAt = :u',
                    ExpressionAttributeNames: {
                        '#t': 'text',
                    },
                    ExpressionAttributeValues: {
                        ':t': body.text ?? '',
                        ':u': now,
                    },
                })
            )

            return { statusCode: 204, headers: corsHeaders, body: '' }
        }

        // ---------- DELETE: メモ削除 ----------
        if (method === 'DELETE') {
            await dynamoClient.send(
                new DeleteCommand({
                    TableName: MEMO_TABLE,
                    Key: { documentId, memoId },
                })
            )
            return { statusCode: 204, headers: corsHeaders, body: '' }
        }

        return { statusCode: 405, body: 'Method Not Allowed' }
    } catch (err) {
        console.error(err)
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Error' }),
        }
    }
}
