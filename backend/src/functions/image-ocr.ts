// backend/src/functions/image-ocr.ts
import { S3Event, S3EventRecord } from 'aws-lambda'
import { DetectDocumentTextCommand, Block } from '@aws-sdk/client-textract'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuidv4 } from 'uuid'

import { textractClient } from '../lib/textractClient'
import { dynamoClient } from '../lib/dynamoClient'
import { getObjectAsBuffer, putObject } from '../lib/s3Utils'
import { generatePdfFromImages } from '../lib/pdfGenerator'
import { config } from '../config/env' // TABLE_NAME など

export const handler = async (event: S3Event) => {
    console.log('ImageOCR function triggered', JSON.stringify(event))

    const promises = event.Records.map(processRecordSafely)
    await Promise.all(promises)

    return { statusCode: 200, body: 'OCR processing completed' }
}

const processRecordSafely = async (record: S3EventRecord) => {
    try {
        await processRecord(record)
    } catch (error) {
        console.error('Error processing OCR record:', {
            bucket: record.s3.bucket.name,
            key: record.s3.object.key,
            error,
        })
        // 必要ならここで DLQ などへ投げる
    }
}

const processRecord = async (record: S3EventRecord) => {
    const bucket = record.s3.bucket.name
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))

    console.log('Processing S3 object for OCR:', { bucket, key })

    // 1. 画像を S3 から取得
    const imageBuffer = await getObjectAsBuffer(bucket, key)

    // 2. Textract で OCR（同期 API）
    const extractedText = await extractTextWithTextract(imageBuffer)

    // ファイル名（拡張子なし）
    const baseName = key.replace(/^.*\//, '').replace(/\.[^.]+$/, '')

    // 3. OCR結果テキストを S3 に保存
    const textKey = `fax/text/${baseName}.txt`
    await putObject({
        bucket,
        key: textKey,
        body: extractedText,
        contentType: 'text/plain; charset=utf-8',
    })

    // 4. 画像 → PDF 変換して S3 に保存
    const pdfBuffer = await generatePdfFromImages([imageBuffer])
    const pdfKey = `fax/pdf/${baseName}.pdf`
    await putObject({
        bucket,
        key: pdfKey,
        body: pdfBuffer,
        contentType: 'application/pdf',
    })

    // 5. DynamoDB に文書メタ情報を登録（type: 'fax'）
    const documentId = uuidv4()
    const now = new Date().toISOString()

    const putCommand = new PutCommand({
        TableName: config.tableName,
        Item: {
            id: documentId,
            type: 'fax' as const,
            subject: '',                // FAXなので空でOK（必要に応じて後で編集）
            sender: 'fax',              // 適当な識別用（必要なら変更）
            receivedAt: now,
            s3Key: pdfKey,              // 一覧で開くときは PDF を参照したい想定
            extractedText,
            metadata: {
                bucket,
                originalImageKey: key,
                textKey,
            },
            createdAt: now,
            updatedAt: now,
        },
    })

    await dynamoClient.send(putCommand)

    console.log('FAX document registered in DynamoDB:', {
        documentId,
        pdfKey,
        textKey,
    })
}

/**
 * Textract で画像からテキストを抽出
 */
const extractTextWithTextract = async (imageBuffer: Buffer): Promise<string> => {
    const res = await textractClient.send(
        new DetectDocumentTextCommand({
            Document: { Bytes: imageBuffer },
        }),
    )

    const lines =
        res.Blocks?.filter((b: Block) => b.BlockType === 'LINE' && b.Text)
            .map((b: Block) => b.Text as string) ?? []

    return lines.join('\n')
}
