import { simpleParser, Attachment } from 'mailparser'
import { ParsedEmail } from './types'

export const parseEmail = async (sesRecord: any): Promise<ParsedEmail> => {
    // SESイベントからメール内容を取得
    // 実際の実装では、S3からEMLファイルを取得して解析

    // 簡易実装例
    const parsed = {
        from: sesRecord.mail.commonHeaders.from[0],
        to: sesRecord.mail.commonHeaders.to || [],
        subject: sesRecord.mail.commonHeaders.subject,
        text: 'Email body will be parsed from S3',
        attachments: [],
    }

    return parsed
}

export const parseEmailFromBuffer = async (buffer: Buffer): Promise<ParsedEmail> => {
    const parsed = await simpleParser(buffer)

    return {
        from: parsed.from?.text || '',
        to: parsed.to?.text ? [parsed.to.text] : [],
        subject: parsed.subject || '',
        text: parsed.text || '',
        html: parsed.html as string | undefined,
        attachments: parsed.attachments.map((att: Attachment) => ({
            filename: att.filename || 'unknown',
            contentType: att.contentType,
            content: att.content,
        })),
    }
}
