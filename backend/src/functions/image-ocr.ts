import { S3Event } from 'aws-lambda'
import { textractClient } from '../lib/textractClient'
import { dynamoClient } from '../lib/dynamoClient'
import {
    StartDocumentTextDetectionCommand,
    GetDocumentTextDetectionCommand,
    Block,
} from '@aws-sdk/client-textract'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'

const TABLE_NAME = process.env.TABLE_NAME || ''

export const handler = async (event: S3Event) => {
    console.log('ImageOCR function triggered', JSON.stringify(event))

    for (const record of event.Records) {
        const bucket = record.s3.bucket.name
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))

        try {
            // Textract処理開始
            const startCommand = new StartDocumentTextDetectionCommand({
                DocumentLocation: {
                    S3Object: {
                        Bucket: bucket,
                        Name: key,
                    },
                },
            })

            const startResponse = await textractClient.send(startCommand)
            const jobId = startResponse.JobId

            // ジョブ完了待ち（簡易実装）
            await new Promise(resolve => setTimeout(resolve, 5000))

            // 結果取得
            const getCommand = new GetDocumentTextDetectionCommand({
                JobId: jobId,
            })

            const getResponse = await textractClient.send(getCommand)

            // テキスト抽出
            const extractedText =
                getResponse.Blocks?.filter((block: Block) => block.BlockType === 'LINE')
                    .map((block: Block) => block.Text)
                    .join('\n') || ''

            // DynamoDBに保存
            const documentId = key.split('/').pop()?.replace('.pdf', '') || ''

            const updateCommand = new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { id: documentId },
                UpdateExpression: 'SET extractedText = :text, updatedAt = :updatedAt',
                ExpressionAttributeValues: {
                    ':text': extractedText,
                    ':updatedAt': new Date().toISOString(),
                },
            })

            await dynamoClient.send(updateCommand)

            console.log(`OCR completed for ${key}`)
        } catch (error) {
            console.error('Error processing OCR:', error)
            throw error
        }
    }

    return { statusCode: 200, body: 'OCR processing completed' }
}
