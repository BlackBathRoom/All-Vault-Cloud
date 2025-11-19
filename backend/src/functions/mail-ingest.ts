import { SESEvent } from 'aws-lambda'
import { s3Client } from '../lib/s3Client'
import { dynamoClient } from '../lib/dynamoClient'
import { parseEmail } from '../lib/mailParser'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

const BUCKET_NAME = process.env.BUCKET_NAME || ''
const TABLE_NAME = process.env.TABLE_NAME || ''

// backend/src/functions/mail-ingest.ts

export const handler = async (event: SESEvent) => {
    console.log('MailIngest function triggered', JSON.stringify(event))

    for (const record of event.Records) {
        try {
            const sesRecord = record.ses
            const messageId = sesRecord.mail.messageId
            const from = sesRecord.mail.commonHeaders.from?.[0] || 'unknown'
            const subject = sesRecord.mail.commonHeaders.subject || 'No Subject'
            const date = sesRecord.mail.commonHeaders.date || new Date().toISOString()

            // 🔸 メール本文 + 添付情報を取得（S3 から EML を読んで解析）
            const emailContent = await parseEmail(record)

            // 添付ファイルを保存（ここは今のままでOK）
            if (emailContent.attachments && emailContent.attachments.length > 0) {
                for (const attachment of emailContent.attachments) {
                    const s3Key = `emails/${messageId}/${attachment.filename}`

                    await s3Client.send(
                        new PutObjectCommand({
                            Bucket: BUCKET_NAME,
                            Key: s3Key,
                            Body: attachment.content,
                            ContentType: attachment.contentType,
                        })
                    )
                }
            }

            // DynamoDBに保存
            const documentId = uuidv4()
            const now = new Date().toISOString()

            const putCommand = new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    id: documentId,
                    type: 'email',
                    subject,
                    sender: from,
                    receivedAt: new Date(date).toISOString(),
                    s3Key: `emails/${messageId}/`,
                    extractedText: emailContent.text, // ★ メール本文を保存
                    metadata: {
                        messageId,
                        to: sesRecord.mail.commonHeaders.to,
                        cc: sesRecord.mail.commonHeaders.cc,
                    },
                    createdAt: now,
                    updatedAt: now,
                },
            })

            await dynamoClient.send(putCommand)

            console.log(`Email ingested: ${messageId}`)
        } catch (error) {
            console.error('Error ingesting email:', error)
            throw error
        }
    }

    return { statusCode: 200, body: 'Email ingestion completed' }
}
