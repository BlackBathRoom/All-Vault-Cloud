// backend/src/functions/documents-Memo.ts
import type {
    APIGatewayProxyEventV2,
    APIGatewayProxyResultV2,
} from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
    DynamoDBDocumentClient,
    GetCommand,
    UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'

const ddbClient = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(ddbClient, {
    marshallOptions: { removeUndefinedValues: true },
})

const DOCUMENTS_TABLE = process.env.DOCUMENTS_TABLE || 'Documents'

const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}

// DynamoDB に保存するメモ1件分
type MemoItem = {
    memoId: string
    text: string
    page: number | null
    createdAt: string
    updatedAt: string
}

// Documents テーブルのレコード（今回使うフィールドだけ）
type DocumentRecord = {
    id: string
    memos?: MemoItem[]
    latestMemoText?: string | null
    latestMemoUpdatedAt?: string | null
}

const isEmptyMemoText = (text: string | null | undefined): boolean => {
    return !text || text.trim() === ''
}


/**
 * HTTP メソッドを型安全に取り出すヘルパー
 */
const getHttpMethod = (event: APIGatewayProxyEventV2): string => {
    if (event.requestContext) {
        const rc = event.requestContext as {
            http?: { method?: string }
            httpMethod?: string
        }

        if (rc.http?.method) {
            return rc.http.method.toUpperCase()
        }

        if (rc.httpMethod) {
            return rc.httpMethod.toUpperCase()
        }
    }

    if ('httpMethod' in event) {
        const e = event as APIGatewayProxyEventV2 & { httpMethod?: string }
        if (typeof e.httpMethod === 'string') {
            return e.httpMethod.toUpperCase()
        }
    }

    return 'GET'
}

/**
 * パス:
 *   /documents/{id}/memos
 * パスパラメータ:
 *   id: Documents.id
 */
export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    console.log('event:', JSON.stringify(event))

    const method = getHttpMethod(event)
    console.log('🔎 resolved method =', method)

    const documentId = event.pathParameters?.id

    if (method === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders, body: '' }
    }

    if (!documentId) {
        return {
            statusCode: 400,
            headers: corsHeaders,
            body: 'documentId is required',
        }
    }

    try {
        // ---------- GET /documents/{id}/memos ----------
        if (method === 'GET') {
            const res = await ddb.send(
                new GetCommand({
                    TableName: DOCUMENTS_TABLE,
                    Key: { id: documentId },
                    ProjectionExpression: 'memos',
                })
            )

            const item = res.Item as DocumentRecord | undefined
            const rawMemos: MemoItem[] = item?.memos ?? []

            // 空メモを除外したリスト
            const cleanedMemos: MemoItem[] = rawMemos.filter(
                (m) => !isEmptyMemoText(m.text)
            )

            // もし空メモが混じっていたら、このタイミングでDBも綺麗にする
            if (cleanedMemos.length !== rawMemos.length) {
                const last: MemoItem | null =
            cleanedMemos.length > 0
                ? cleanedMemos[cleanedMemos.length - 1]
                : null

                if (last) {
                    await ddb.send(
                        new UpdateCommand({
                            TableName: DOCUMENTS_TABLE,
                            Key: { id: documentId },
                            UpdateExpression:
                                'SET memos = :m, latestMemoText = :text, latestMemoUpdatedAt = :updatedAt',
                            ExpressionAttributeValues: {
                                ':m': cleanedMemos,
                                ':text': last.text,
                                ':updatedAt': last.updatedAt,
                            },
                        })
                    )
                } else {
                    await ddb.send(
                        new UpdateCommand({
                            TableName: DOCUMENTS_TABLE,
                            Key: { id: documentId },
                            UpdateExpression:
                                'SET memos = :m REMOVE latestMemoText, latestMemoUpdatedAt',
                            ExpressionAttributeValues: {
                                ':m': [],
                            },
                        })
                    )
                }
            }

            // クライアントには「空じゃないメモだけ」返す
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify(cleanedMemos),
            }
        }


        const body = event.body ? (JSON.parse(event.body) as unknown) : {}

        // POST のリクエストボディ型
        type DeleteBody = { mode: 'delete'; memoId: string }
        type UpdateBody = {
            mode: 'update'
            memoId: string
            text: string
            page?: number | null
        }
        type CreateBody = {
            mode?: undefined
            text?: string
            page?: number | null
        }

        type PostBody = DeleteBody | UpdateBody | CreateBody

        const req = body as PostBody

        // ---------- POST /documents/{id}/memos ----------
        if (method === 'POST') {
            // 🎯 1) 削除モード
            if (req.mode === 'delete') {
                const memoId = (req as DeleteBody).memoId
                if (!memoId) {
                    return {
                        statusCode: 400,
                        headers: corsHeaders,
                        body: 'memoId is required',
                    }
                }

                // 現在の memos を取得
                const getRes = await ddb.send(
                    new GetCommand({
                        TableName: DOCUMENTS_TABLE,
                        Key: { id: documentId },
                        ProjectionExpression: 'memos',
                    })
                )

                const item = getRes.Item as DocumentRecord | undefined
                const currentMemos: MemoItem[] = (item?.memos ?? []).filter(
                    (m: MemoItem) => m.memoId !== memoId
                )

                // latestMemo を再計算
                const last: MemoItem | null =
                    currentMemos.length > 0
                        ? currentMemos[currentMemos.length - 1]
                        : null

                if (last) {
                    await ddb.send(
                        new UpdateCommand({
                            TableName: DOCUMENTS_TABLE,
                            Key: { id: documentId },
                            UpdateExpression:
                                'SET memos = :m, latestMemoText = :text, latestMemoUpdatedAt = :updatedAt',
                            ExpressionAttributeValues: {
                                ':m': currentMemos,
                                ':text': last.text,
                                ':updatedAt': last.updatedAt,
                            },
                        })
                    )
                } else {
                    await ddb.send(
                        new UpdateCommand({
                            TableName: DOCUMENTS_TABLE,
                            Key: { id: documentId },
                            UpdateExpression:
                                'SET memos = :m REMOVE latestMemoText, latestMemoUpdatedAt',
                            ExpressionAttributeValues: {
                                ':m': currentMemos,
                            },
                        })
                    )
                }

                return {
                    statusCode: 204,
                    headers: corsHeaders,
                    body: '',
                }
            }

            // ✏️ 2) 更新モード
            if (req.mode === 'update') {
                const { memoId, text, page } = req as UpdateBody

                if (!memoId) {
                    return {
                        statusCode: 400,
                        headers: corsHeaders,
                        body: 'memoId is required',
                    }
                }

                if (!text || text.trim() === '') {
                    return {
                        statusCode: 400,
                        headers: corsHeaders,
                        body: 'text is required',
                    }
                }

                const now = new Date().toISOString()

                // 現在の memos を取得
                const getRes = await ddb.send(
                    new GetCommand({
                        TableName: DOCUMENTS_TABLE,
                        Key: { id: documentId },
                        ProjectionExpression: 'memos',
                    })
                )

                const item = getRes.Item as DocumentRecord | undefined
                const currentMemos: MemoItem[] = item?.memos ?? []

                const index = currentMemos.findIndex(
                    (m: MemoItem) => m.memoId === memoId
                )

                if (index === -1) {
                    return {
                        statusCode: 404,
                        headers: corsHeaders,
                        body: 'memo not found',
                    }
                }

                const updatedMemo: MemoItem = {
                    ...currentMemos[index],
                    text,
                    page: typeof page === 'number'
                        ? page
                        : currentMemos[index].page ?? null,
                    updatedAt: now,
                }

                const updatedMemos: MemoItem[] = [...currentMemos]
                updatedMemos[index] = updatedMemo

                // 空メモ掃除
                const cleanedMemos: MemoItem[] = updatedMemos.filter(
                    (m) => !isEmptyMemoText(m.text)
                )

                // latestMemo 再計算
                const last: MemoItem | null =
                    cleanedMemos.length > 0
                        ? cleanedMemos[cleanedMemos.length - 1]
                        : null

                if (last) {
                    await ddb.send(
                        new UpdateCommand({
                            TableName: DOCUMENTS_TABLE,
                            Key: { id: documentId },
                            UpdateExpression:
                                'SET memos = :m, latestMemoText = :text, latestMemoUpdatedAt = :updatedAt',
                            ExpressionAttributeValues: {
                                ':m': cleanedMemos,
                                ':text': last.text,
                                ':updatedAt': last.updatedAt,
                            },
                        })
                    )
                } else {
                    await ddb.send(
                        new UpdateCommand({
                            TableName: DOCUMENTS_TABLE,
                            Key: { id: documentId },
                            UpdateExpression:
                                'SET memos = :m REMOVE latestMemoText, latestMemoUpdatedAt',
                            ExpressionAttributeValues: {
                                ':m': [],
                            },
                        })
                    )
                }

                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify(updatedMemo),
                }
            }

            // 🆕 3) ここまで来たら「新規作成モード」
            const now = new Date().toISOString()
            const createReq = req as CreateBody

            const text =
                typeof createReq.text === 'string' ? createReq.text : ''
            const page =
                typeof createReq.page === 'number'
                    ? createReq.page
                    : null

            // 空メモは「掃除だけして終了」
            if (!text || text.trim() === '') {
                console.log('🧹 空メモ扱いとして既存の空メモを削除します')

                const getRes = await ddb.send(
                    new GetCommand({
                        TableName: DOCUMENTS_TABLE,
                        Key: { id: documentId },
                        ProjectionExpression: 'memos',
                    })
                )

                const item = getRes.Item as DocumentRecord | undefined
                const rawMemos: MemoItem[] = item?.memos ?? []

                const cleanedMemos: MemoItem[] = rawMemos.filter(
                    (m) => m.text && m.text.trim() !== ''
                )

                const last: MemoItem | null =
                    cleanedMemos.length > 0
                        ? cleanedMemos[cleanedMemos.length - 1]
                        : null

                if (last) {
                    await ddb.send(
                        new UpdateCommand({
                            TableName: DOCUMENTS_TABLE,
                            Key: { id: documentId },
                            UpdateExpression:
                                'SET memos = :m, latestMemoText = :text, latestMemoUpdatedAt = :updatedAt',
                            ExpressionAttributeValues: {
                                ':m': cleanedMemos,
                                ':text': last.text,
                                ':updatedAt': last.updatedAt,
                            },
                        })
                    )
                } else {
                    await ddb.send(
                        new UpdateCommand({
                            TableName: DOCUMENTS_TABLE,
                            Key: { id: documentId },
                            UpdateExpression:
                                'SET memos = :m REMOVE latestMemoText, latestMemoUpdatedAt',
                            ExpressionAttributeValues: {
                                ':m': [],
                            },
                        })
                    )
                }

                return {
                    statusCode: 204,
                    headers: corsHeaders,
                    body: '',
                }
            }

            const memo: MemoItem = {
                memoId: randomUUID(),
                text,
                page,
                createdAt: now,
                updatedAt: now,
            }

            await ddb.send(
                new UpdateCommand({
                    TableName: DOCUMENTS_TABLE,
                    Key: { id: documentId },
                    UpdateExpression:
                        'SET memos = list_append(if_not_exists(memos, :empty), :m), ' +
                        'latestMemoText = :text, ' +
                        'latestMemoUpdatedAt = :updatedAt',
                    ExpressionAttributeValues: {
                        ':empty': [] as MemoItem[],
                        ':m': [memo],
                        ':text': memo.text,
                        ':updatedAt': memo.updatedAt,
                    },
                })
            )

            return {
                statusCode: 201,
                headers: corsHeaders,
                body: JSON.stringify(memo),
            }
        }




        // 他メソッドは 405
        return {
            statusCode: 405,
            headers: corsHeaders,
            body: 'Method Not Allowed',
        }
    } catch (err: unknown) {
        console.error(err)
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: 'Internal Server Error',
                detail: err instanceof Error ? err.message : String(err),
            }),
        }
    }
}
