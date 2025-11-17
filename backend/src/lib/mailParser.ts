import { simpleParser, Attachment } from 'mailparser'
import { ParsedEmail } from './types'
import { SESEventRecord } from 'aws-lambda'

export const parseEmail = async (sesRecord: SESEventRecord): Promise<ParsedEmail> => {
    // SESイベントからメール内容を取得
    // 実際の実装では、S3からEMLファイルを取得して解析

    // 簡易実装例
    const parsed = {
        from: sesRecord.ses.mail.commonHeaders.from?.[0] || 'unknown',
        to: sesRecord.ses.mail.commonHeaders.to || [],
        subject: sesRecord.ses.mail.commonHeaders.subject || 'No Subject',
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
