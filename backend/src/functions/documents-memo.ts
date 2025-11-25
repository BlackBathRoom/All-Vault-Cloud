import {
    APIGatewayProxyEventV2,
    APIGatewayProxyResultV2,
} from 'aws-lambda'
import { ScanCommand } from '@aws-sdk/lib-dynamodb'
import { dynamoClient } from '../lib/dynamoClient'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from '../lib/s3Client'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
  
const DOCUMENTS_TABLE = process.env.DOCUMENTS_TABLE || 'Documents'
const UPLOAD_BUCKET = process.env.UPLOAD_BUCKET || process.env.BUCKET_NAME || ''
  
const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
}
  
  type DocumentItem = {
    id: string
    type?: 'fax' | 'email' | 'document'
    subject?: string | null
    from?: string | null
    createdAt?: string
    pdfKey?: string
  }
  
  type DocumentDto = {
    id: string
    type: 'fax' | 'email' | 'document'
    subject: string
    sender: string
    receivedAt: string
    s3Key: string
    fileUrl: string | null
    fileSize: number | null
  }
  
export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    try {
        const method = event.requestContext.http.method
  
        if (method === 'OPTIONS') {
            return { statusCode: 204, headers: corsHeaders, body: '' }
        }
  
        if (method !== 'GET') {
            return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' }
        }
  
        // Documents テーブル全件（PoCなので Scan）
        const res = await dynamoClient.send(
            new ScanCommand({
                TableName: DOCUMENTS_TABLE,
            })
        )
  
        const items = (res.Items ?? []) as DocumentItem[]
  
        const docs: DocumentDto[] = []
        for (const item of items) {
            if (!item.id || !item.pdfKey) continue
    
            const type: 'fax' | 'email' | 'document' =
            item.type ?? 'fax'
    
            const subject = item.subject ?? '(件名なし)'
            const sender = item.from ?? '(送信者不明)'
            const receivedAt = item.createdAt ?? ''
    
            let fileUrl: string | null = null
            if (UPLOAD_BUCKET && item.pdfKey) {
                const cmd = new GetObjectCommand({
                    Bucket: UPLOAD_BUCKET,
                    Key: item.pdfKey,
                })
                fileUrl = await getSignedUrl(s3Client, cmd, { expiresIn: 3600 })
            }
  
            docs.push({
                id: item.id,
                type,
                subject,
                sender,
                receivedAt,
                s3Key: item.pdfKey,
                fileUrl,
                fileSize: null, // 必要なら後で HeadObject などで取得
            })
        }
    
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ documents: docs }),
        }
    } catch (err) {
        console.error(err)
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Internal Error', detail: String(err) }),
        }
    }
}
  