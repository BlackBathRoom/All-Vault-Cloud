export interface Document {
    id: string
    type: 'fax' | 'email_body' | 'email_attachment'
    subject?: string | null
    from?: string | null
    createdAt: string
    s3Key?: string
    pdfKey?: string
    textKey?: string
    parentMailId?: string
    extractedText?: string
    metadata?: Record<string, unknown>
}
