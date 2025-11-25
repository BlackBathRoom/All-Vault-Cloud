import {
    APIGatewayProxyEventV2,
    APIGatewayProxyResultV2,
} from 'aws-lambda'
import {
    GetCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { dynamoClient } from '../lib/dynamoClient'
import { randomUUID } from 'crypto'

const DOCUMENTS_TABLE = process.env.DOCUMENTS_TABLE || 'Documents'

const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
}

type DocumentMemo = {
    memoId: string
    text: string
    page: number | null
    createdAt: string
    updatedAt: string
}

type DocumentItem = {
    id: string
    memos?: DocumentMemo[]
}

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    try {
        const method = event.requestContext.http.method
        const documentId = event.pathParameters?.id
        const memoId = event.pathParameters?.memoId ?? undefined

        // ----- OPTIONS (CORS プリフライト) -----
        if (method === 'OPTIONS') {
            return {
                statusCode: 204,
                headers: corsHeaders,
                body: '',
            }
        }

        if (!documentId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: 'documentId is required',
            }
        }

        // ----- GET /documents/{id}/memos -----
        if (method === 'GET' && !memoId) {
            const res = await dynamoClient.send(
                new GetCommand({
                    TableName: DOCUMENTS_TABLE,
                    Key: { id: documentId },
                })
            )

            const item = res.Item as DocumentItem | undefined
            const memos: DocumentMemo[] = item?.memos ?? []

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify(memos),
            }
        }

        const body = event.body ? (JSON.parse(event.body) as Partial<DocumentMemo>) : {}

        // ----- POST /documents/{id}/memos -----
        if (method === 'POST' && !memoId) {
            const now = new Date().toISOString()

            const newMemo: DocumentMemo = {
                memoId: randomUUID(),
                text: body.text ?? '',
                page: typeof body.page === 'number' ? body.page : null,
                createdAt: now,
                updatedAt: now,
            }

            await dynamoClient.send(
                new UpdateCommand({
                    TableName: DOCUMENTS_TABLE,
                    Key: { id: documentId },
                    UpdateExpression:
                        'SET memos = list_append(if_not_exists(memos, :empty), :memo)',
                    ExpressionAttributeValues: {
                        ':empty': [],
                        ':memo': [newMemo],
                    },
                })
            )

            return {
                statusCode: 201,
                headers: corsHeaders,
                body: JSON.stringify(newMemo),
            }
        }

        if (!memoId) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: 'memoId is required',
            }
        }

        // ----- 共通: Document 1件取得 -----
        const getDocRes = await dynamoClient.send(
            new GetCommand({
                TableName: DOCUMENTS_TABLE,
                Key: { id: documentId },
            })
        )

        const docItem = getDocRes.Item as DocumentItem | undefined

        if (!docItem) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: 'Document not found',
            }
        }

        const currentMemos: DocumentMemo[] = docItem.memos ?? []

        // ----- PUT /documents/{id}/memos/{memoId} -----
        if (method === 'PUT') {
            const now = new Date().toISOString()

            const updatedMemos: DocumentMemo[] = currentMemos.map((m) =>
                m.memoId === memoId
                    ? {
                        ...m,
                        text: body.text ?? m.text,
                        updatedAt: now,
                    }
                    : m
            )

            const exists = updatedMemos.some((m) => m.memoId === memoId)
            if (!exists) {
                return {
                    statusCode: 404,
                    headers: corsHeaders,
                    body: 'Memo not found',
                }
            }

            await dynamoClient.send(
                new UpdateCommand({
                    TableName: DOCUMENTS_TABLE,
                    Key: { id: documentId },
                    UpdateExpression: 'SET memos = :m',
                    ExpressionAttributeValues: {
                        ':m': updatedMemos,
                    },
                })
            )

            return {
                statusCode: 204,
                headers: corsHeaders,
                body: '',
            }
        }

        // ----- DELETE /documents/{id}/memos/{memoId} -----
        if (method === 'DELETE') {
            const filteredMemos: DocumentMemo[] = currentMemos.filter(
                (m) => m.memoId !== memoId
            )

            await dynamoClient.send(
                new UpdateCommand({
                    TableName: DOCUMENTS_TABLE,
                    Key: { id: documentId },
                    UpdateExpression: 'SET memos = :m',
                    ExpressionAttributeValues: {
                        ':m': filteredMemos,
                    },
                })
            )

            return {
                statusCode: 204,
                headers: corsHeaders,
                body: '',
            }
        }

        return {
            statusCode: 405,
            headers: corsHeaders,
            body: 'Method Not Allowed',
        }
    } catch (err) {
        console.error(err)
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: 'Internal Error',
                detail: String(err),
            }),
        }
    }
}
