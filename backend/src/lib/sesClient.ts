import { SESClient } from '@aws-sdk/client-ses'

const region = process.env.AWS_REGION || 'ap-northeast-1'

export const sesClient = new SESClient({ region })
