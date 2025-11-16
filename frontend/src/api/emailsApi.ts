import { apiClient } from './client.ts'

interface EmailRequest {
    to: string
    subject: string
    body: string
}

export const sendEmail = async (data: EmailRequest): Promise<void> => {
    return apiClient.post('/emails/send', data)
}
