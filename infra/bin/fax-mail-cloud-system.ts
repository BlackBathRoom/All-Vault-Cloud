#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { FaxMailCloudStack } from '../lib/fax-mail-cloud-stack'

const app = new cdk.App()

new FaxMailCloudStack(app, 'FaxMailCloudStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
    },
    description: 'FAX・メール・クラウドシステム',
})
