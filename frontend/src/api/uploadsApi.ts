import { apiClient } from './client.ts'

interface PresignedUrlResponse {
    url: string
    key: string
}

export const getPresignedUrl = async (
    fileName: string,
    contentType: string
): Promise<PresignedUrlResponse> => {
    return apiClient.post('/uploads/presigned-url', {
        fileName,
        contentType,
    })
}
