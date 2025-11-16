import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { dynamoClient } from '../lib/dynamoClient'
import { generatePresignedUrl } from '../lib/presignedUrl'
import { ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb'

const TABLE_NAME = process.env.TABLE_NAME || ''
const BUCKET_NAME = process.env.BUCKET_NAME || ''

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('ApiHandler function triggered', JSON.stringify(event))

    const method = event.httpMethod
    const path = event.path

    try {
        // GET /documents - 文書一覧取得
        if (method === 'GET' && path === '/documents') {
            const type = event.queryStringParameters?.type

            const scanCommand = new ScanCommand({
                TableName: TABLE_NAME,
                FilterExpression: type ? '#type = :type' : undefined,
                ExpressionAttributeNames: type ? { '#type': 'type' } : undefined,
                ExpressionAttributeValues: type ? { ':type': type } : undefined,
            })

            const result = await dynamoClient.send(scanCommand)

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result.Items || []),
            }
        }

        // GET /documents/:id - 文書詳細取得
        if (method === 'GET' && path.startsWith('/documents/')) {
            const id = path.split('/')[2]

            const getCommand = new GetCommand({
                TableName: TABLE_NAME,
                Key: { id },
            })

            const result = await dynamoClient.send(getCommand)

            if (!result.Item) {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ message: 'Document not found' }),
                }
            }

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result.Item),
            }
        }

        // POST /uploads/presigned-url - 署名付きURL生成
        if (method === 'POST' && path === '/uploads/presigned-url') {
            const body = JSON.parse(event.body || '{}')
            const { fileName, contentType } = body

            const key = `fax/${Date.now()}-${fileName}`
            const url = await generatePresignedUrl(BUCKET_NAME, key, contentType)

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
    } catch (error) {
        console.error('Error:', error)
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: String(error) }),
        }
    }
}
