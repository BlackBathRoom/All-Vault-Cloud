export interface Document {
    id: string
    type: 'fax' | 'email' | 'document'
    subject: string
    sender: string
    receivedAt: string
    s3Key?: string
    extractedText?: string
    metadata?: Record<string, unknown>
}
