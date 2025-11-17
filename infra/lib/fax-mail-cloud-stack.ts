import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as ses from 'aws-cdk-lib/aws-ses'
import * as s3n from 'aws-cdk-lib/aws-s3-notifications'
import * as iam from 'aws-cdk-lib/aws-iam'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as path from 'path'

export class FaxMailCloudStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        // S3 Bucket (単一バケットでprefix構造により管理)
        // prefix構造:
        // - uploads/raw/     : FAX画像アップロード先
        // - uploads/text/    : OCR抽出テキスト保存先
        // - uploads/pdf/     : FAX PDF生成先
        // - ses-raw-mail/    : SES受信メールのEML保存先
        // - emails/text/     : メール本文テキスト保存先
        // - docs/email/      : メール添付PDF保存先
        const faxSystemBucket = new s3.Bucket(this, 'FaxSystemBucket', {
            bucketName: `fax-system-${this.account}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            cors: [
                {
                    allowedMethods: [
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST,
                    ],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                },
            ],
        })

        // DynamoDB Table
        const documentsTable = new dynamodb.Table(this, 'DocumentsTable', {
            tableName: 'Documents',
            partitionKey: {
                name: 'id',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        })

        // Lambda Functions
        const imageOcrFunction = new NodejsFunction(this, 'ImageOCRFunction', {
            entry: path.join(__dirname, '../../backend/dist/functions/image-ocr.js'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            timeout: cdk.Duration.minutes(5),
            environment: {
                BUCKET_NAME: faxSystemBucket.bucketName,
                TABLE_NAME: documentsTable.tableName,
                REGION: this.region,
            },
        })

        const mailIngestFunction = new NodejsFunction(this, 'MailIngestFunction', {
            entry: path.join(__dirname, '../../backend/dist/functions/mail-ingest.js'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            timeout: cdk.Duration.minutes(5),
            environment: {
                BUCKET_NAME: faxSystemBucket.bucketName,
                TABLE_NAME: documentsTable.tableName,
                REGION: this.region,
            },
        })

        const apiHandlerFunction = new NodejsFunction(this, 'ApiHandlerFunction', {
            entry: path.join(__dirname, '../../backend/dist/functions/api-handler.js'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            timeout: cdk.Duration.seconds(30),
            environment: {
                BUCKET_NAME: faxSystemBucket.bucketName,
                TABLE_NAME: documentsTable.tableName,
                REGION: this.region,
            },
        })

        const mailSendFunction = new NodejsFunction(this, 'MailSendFunction', {
            entry: path.join(__dirname, '../../backend/dist/functions/mail-send.js'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            timeout: cdk.Duration.seconds(30),
            environment: {
                BUCKET_NAME: faxSystemBucket.bucketName,
                TABLE_NAME: documentsTable.tableName,
                REGION: this.region,
                SENDER_EMAIL: 'noreply@example.com', // 要変更
            },
        })

        // Permissions
        faxSystemBucket.grantReadWrite(imageOcrFunction)
        documentsTable.grantReadWriteData(imageOcrFunction)

        faxSystemBucket.grantReadWrite(mailIngestFunction)
        documentsTable.grantReadWriteData(mailIngestFunction)

        faxSystemBucket.grantReadWrite(apiHandlerFunction)
        documentsTable.grantReadData(apiHandlerFunction)

        mailSendFunction.addToRolePolicy(
            new iam.PolicyStatement({
                actions: ['ses:SendEmail', 'ses:SendRawEmail'],
                resources: ['*'],
            })
        )

        imageOcrFunction.addToRolePolicy(
            new iam.PolicyStatement({
                actions: [
                    'textract:StartDocumentTextDetection',
                    'textract:GetDocumentTextDetection',
                ],
                resources: ['*'],
            })
        )

        // S3 Event Notifications
        // uploads/raw/ にアップロードされた画像ファイルをトリガーにImageOCRFunctionを実行
        faxSystemBucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(imageOcrFunction),
            { prefix: 'uploads/raw/' }
        )

        // API Gateway
        const api = new apigateway.RestApi(this, 'FaxMailCloudApi', {
            restApiName: 'Fax Mail Cloud API',
            description: 'API for FAX and Email Cloud System',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
            },
        })

        const apiIntegration = new apigateway.LambdaIntegration(apiHandlerFunction)

        const documents = api.root.addResource('documents')
        documents.addMethod('GET', apiIntegration)

        const document = documents.addResource('{id}')
        document.addMethod('GET', apiIntegration)

        const uploads = api.root.addResource('uploads')
        const presignedUrl = uploads.addResource('presigned-url')
        presignedUrl.addMethod('POST', apiIntegration)

        const emails = api.root.addResource('emails')
        const send = emails.addResource('send')
        send.addMethod('POST', new apigateway.LambdaIntegration(mailSendFunction))

        // Outputs
        new cdk.CfnOutput(this, 'ApiUrl', {
            value: api.url,
            description: 'API Gateway URL',
        })

        new cdk.CfnOutput(this, 'FaxSystemBucketName', {
            value: faxSystemBucket.bucketName,
            description: 'FAX System S3 Bucket Name',
        })

        new cdk.CfnOutput(this, 'DocumentsTableName', {
            value: documentsTable.tableName,
            description: 'DynamoDB Table Name',
        })
    }
}
