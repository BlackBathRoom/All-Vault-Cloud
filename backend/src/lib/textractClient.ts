import { TextractClient } from '@aws-sdk/client-textract'

const region = process.env.AWS_REGION || 'ap-northeast-1'

export const textractClient = new TextractClient({ region })
