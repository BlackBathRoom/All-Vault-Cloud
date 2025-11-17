import { simpleParser, Attachment, AddressObject, ParsedMail } from 'mailparser'
import { ParsedEmail } from './types'
import { SESEventRecord } from 'aws-lambda'

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

/**
 * SES のイベント（Lambda）からメール情報を抽出（簡易版）
 */
export const parseEmail = async (
    sesRecord: SESEventRecord
): Promise<ParsedEmail> => {
    const parsed = {
        from: sesRecord.ses.mail.commonHeaders.from?.[0] || 'unknown',
        to: sesRecord.ses.mail.commonHeaders.to || [],
        subject: sesRecord.ses.mail.commonHeaders.subject || 'No Subject',
        text: 'Email body will be parsed from S3',
        attachments: [],
    }

    return parsed
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
