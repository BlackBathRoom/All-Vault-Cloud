import { simpleParser, Attachment, ParsedMail, AddressObject } from 'mailparser'
import { ParsedEmail } from './types'

const addressToText = (
    addr: AddressObject | AddressObject[] | undefined ): string => {
    if (!addr) return ''

    if (Array.isArray(addr)) {
        // 配列なら text を結合 or 先頭だけでも OK
        return addr.map(a => a.text).join(', ')
    }

    return addr.text
}

const addressToTextArray = (
    addr: AddressObject | AddressObject[] | undefined
): string[] => {
    if (!addr) return []

    if (Array.isArray(addr)) {
        return addr.map(a => a.text)
    }

    return [addr.text]
}

export const parseEmailFromBuffer = async (buffer: Buffer): Promise<ParsedEmail> => {
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
