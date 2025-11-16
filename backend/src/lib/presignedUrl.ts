import { s3Client } from './s3Client'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export const generatePresignedUrl = async (
    bucket: string,
    key: string,
    contentType: string,
    expiresIn: number = 3600
): Promise<string> => {
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
    })

    const url = await getSignedUrl(s3Client, command, { expiresIn })
    return url
}
