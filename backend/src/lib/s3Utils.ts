// backend/src/lib/s3Utils.ts
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from './s3Client'

/**
 * S3オブジェクトを Buffer として取得
 */
export const getObjectAsBuffer = async (bucket: string, key: string): Promise<Buffer> => {
    try {
        const res = await s3Client.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            }),
        )

        if (!res.Body) {
            throw new Error(`S3 object body is empty: ${bucket}/${key}`)
        }

        const chunks: Uint8Array[] = []
        for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
            chunks.push(chunk)
        }

        return Buffer.concat(chunks)
    } catch (err) {
        console.error('getObjectAsBuffer error', { bucket, key, err })
        throw err
    }
}

type PutObjectParams = {
    bucket: string
    key: string
    body: Buffer | string
    contentType?: string
}

/**
 * S3 にファイルを保存
 */
export const putObject = async ({ bucket, key, body, contentType }: PutObjectParams): Promise<void> => {
    try {
        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: body,
                ContentType: contentType,
            }),
        )
    } catch (err) {
        console.error('putObject error', { bucket, key, err })
        throw err
    }
}
