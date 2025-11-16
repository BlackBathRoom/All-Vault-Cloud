export const getEnv = (key: string, defaultValue?: string): string => {
    const value = process.env[key]
    if (!value && !defaultValue) {
        throw new Error(`Environment variable ${key} is not set`)
    }
    return value || defaultValue || ''
}

export const config = {
    awsRegion: getEnv('AWS_REGION', 'ap-northeast-1'),
    tableName: getEnv('TABLE_NAME', ''),
    bucketName: getEnv('BUCKET_NAME', ''),
    senderEmail: getEnv('SENDER_EMAIL', ''),
}
