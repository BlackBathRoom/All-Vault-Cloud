import { simpleParser, Attachment, AddressObject, ParsedMail } from 'mailparser'
import { ParsedEmail } from './types'
import { SESEventRecord } from 'aws-lambda'
import { getObjectAsBuffer } from './s3Utils'

interface SESReceiptActionS3 {
    type: 'S3'
    bucketName: string
    objectKey: string
}

/**
 * AddressObject | AddressObject[] | undefined → string に変換
 */
const addressToText = (
    addr?: AddressObject | AddressObject[]
): string => {
    if (!addr) return ''
    return Array.isArray(addr)
        ? addr.map(a => a.text).join(', ')
        : addr.text
}

/**
 * AddressObject | AddressObject[] | undefined → string[] に変換
 */
const addressToTextArray = (
    addr?: AddressObject | AddressObject[]
): string[] => {
    if (!addr) return []
    return Array.isArray(addr)
        ? addr.map(a => a.text)
        : [addr.text]
}

export const parseEmail = async (
    sesRecord: SESEventRecord
): Promise<ParsedEmail> => {
    // SES → S3 アクション情報を取得
    const action = sesRecord.ses.receipt.action as SESReceiptActionS3
    const bucket = action.bucketName
    const key = action.objectKey

    // S3からEMLを取得して解析
    const emlBuffer = await getObjectAsBuffer(bucket, key)
    return parseEmailFromBuffer(emlBuffer)
}

/**
 * S3 から取得した EML バッファを mailparser で解析
 */
export const parseEmailFromBuffer = async (
    buffer: Buffer
): Promise<ParsedEmail> => {
    const parsed: ParsedMail = await simpleParser(buffer)

    return {
        from: addressToText(parsed.from),
        to: addressToTextArray(parsed.to),
        subject: parsed.subject || '',
        text: parsed.text || '',
        html: typeof parsed.html === 'string' ? parsed.html : undefined,
        attachments: parsed.attachments.map((att: Attachment) => ({
            filename: att.filename || 'unknown',
            contentType: att.contentType,
            content: att.content,
        })),
    }
}
