export interface Document {
    id: string
    type: 'fax' | 'email'
    subject: string
    sender: string
    receivedAt: string
    s3Key: string
    extractedText?: string
    metadata?: Record<string, unknown>
    createdAt: string
    updatedAt: string
}

export interface EmailAttachment {
    filename: string
    contentType: string
    content: Buffer
}

export interface ParsedEmail {
    from: string
    to: string[]
    subject: string
    text: string
    html?: string
    attachments?: EmailAttachment[]
}
