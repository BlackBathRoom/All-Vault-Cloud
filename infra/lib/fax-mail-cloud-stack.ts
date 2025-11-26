import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as ses from 'aws-cdk-lib/aws-ses'
import * as sesActions from 'aws-cdk-lib/aws-ses-actions'
import * as s3n from 'aws-cdk-lib/aws-s3-notifications'
import * as iam from 'aws-cdk-lib/aws-iam'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as path from 'path'

/**
 * FAX・メール・クラウドシステムのメインスタック
 * 
 * このスタックは以下のAWSリソースを作成します：
 * - S3: ドキュメントストレージ（prefix構造管理）
 * - DynamoDB: ドキュメントメタデータテーブル（GSI付き）
 * - Lambda: 4つの関数（OCR、メール取り込み、API、メール送信）
 * - API Gateway: RESTful API
 * - SES: メール受信ルール
 */
export class FaxMailCloudStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        // S3 Bucket (既存バケットを参照)
        // prefix構造:
        // - uploads/raw/     : FAX画像アップロード先
        // - uploads/text/    : OCR抽出テキスト保存先
        // - uploads/pdf/     : FAX PDF生成先
        // - ses-raw-mail/    : SES受信メールのEML保存先
        // - emails/text/     : メール本文テキスト保存先
        // - docs/email/      : メール添付PDF保存先
        const faxSystemBucket = s3.Bucket.fromBucketName(
            this,
            'FaxSystemBucket',
            'avc-system'
        )

        // DynamoDB Table (既存テーブルを参照)
        const documentsTable = dynamodb.Table.fromTableName(
            this,
            'DocumentsTable',
            'Documents'
        )
        
        // 注意: GSIは既存テーブルに手動で追加する必要があります
        // AWS Console または AWS CLIで以下のGSIを追加してください:
        // 1. type-createdAt-index (PK: type, SK: createdAt)
        // 2. sender-createdAt-index (PK: sender, SK: createdAt)
        // 3. folder-createdAt-index (PK: folder, SK: createdAt)
        // 4. category-createdAt-index (PK: category, SK: createdAt)

        // Lambda Functions
        const imageOcrFunction = new NodejsFunction(this, 'ImageOCRFunction', {
            entry: path.join(__dirname, '../../backend/dist/functions/image-ocr.js'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 1024, // OCR処理のため多めに確保
            timeout: cdk.Duration.minutes(5),
            logRetention: logs.RetentionDays.ONE_WEEK, // ログ保持期間: 1週間
            environment: {
                BUCKET_NAME: faxSystemBucket.bucketName,
                TABLE_NAME: documentsTable.tableName,
                REGION: this.region,
                NODE_OPTIONS: '--enable-source-maps',
            },
            bundling: {
                minify: true,
                sourceMap: true,
                externalModules: ['@aws-sdk/*'], // AWS SDK v3はLambdaランタイムに含まれる
            },
        })

        const mailIngestFunction = new NodejsFunction(this, 'MailIngestFunction', {
            entry: path.join(__dirname, '../../backend/dist/functions/mail-ingest.js'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 512, // メール解析用
            timeout: cdk.Duration.minutes(3),
            logRetention: logs.RetentionDays.ONE_WEEK, // ログ保持期間: 1週間
            environment: {
                BUCKET_NAME: faxSystemBucket.bucketName,
                TABLE_NAME: documentsTable.tableName,
                REGION: this.region,
                NODE_OPTIONS: '--enable-source-maps',
            },
            bundling: {
                minify: true,
                sourceMap: true,
                externalModules: ['@aws-sdk/*'],
            },
        })

        const apiHandlerFunction = new NodejsFunction(this, 'ApiHandlerFunction', {
            entry: path.join(__dirname, '../../backend/dist/functions/api-handler.js'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 256, // API処理は軽量
            timeout: cdk.Duration.seconds(30),
            logRetention: logs.RetentionDays.ONE_WEEK, // ログ保持期間: 1週間
            environment: {
                BUCKET_NAME: faxSystemBucket.bucketName,
                TABLE_NAME: documentsTable.tableName,
                REGION: this.region,
                NODE_OPTIONS: '--enable-source-maps',
            },
            bundling: {
                minify: true,
                sourceMap: true,
                externalModules: ['@aws-sdk/*'],
            },
        })

        const mailSendFunction = new NodejsFunction(this, 'MailSendFunction', {
            entry: path.join(__dirname, '../../backend/dist/functions/mail-send.js'),
            handler: 'handler',
            runtime: lambda.Runtime.NODEJS_20_X,
            memorySize: 256, // メール送信は軽量
            timeout: cdk.Duration.seconds(30),
            logRetention: logs.RetentionDays.ONE_WEEK, // ログ保持期間: 1週間
            environment: {
                BUCKET_NAME: faxSystemBucket.bucketName,
                TABLE_NAME: documentsTable.tableName,
                REGION: this.region,
                SENDER_EMAIL: 'noreply@example.com', // 要変更
                NODE_OPTIONS: '--enable-source-maps',
            },
            bundling: {
                minify: true,
                sourceMap: true,
                externalModules: ['@aws-sdk/*'],
            },
        })

        // Permissions
        // ImageOCRFunction: uploads/raw/, uploads/text/, uploads/pdf/ の読み書き
        faxSystemBucket.grantRead(imageOcrFunction, 'uploads/raw/*')
        faxSystemBucket.grantWrite(imageOcrFunction, 'uploads/text/*')
        faxSystemBucket.grantWrite(imageOcrFunction, 'uploads/pdf/*')
        documentsTable.grantReadWriteData(imageOcrFunction)

        // MailIngestFunction: ses-raw-mail/, emails/text/, docs/email/ の読み書き
        faxSystemBucket.grantRead(mailIngestFunction, 'ses-raw-mail/*')
        faxSystemBucket.grantWrite(mailIngestFunction, 'emails/text/*')
        faxSystemBucket.grantWrite(mailIngestFunction, 'docs/email/*')
        documentsTable.grantReadWriteData(mailIngestFunction)

        // ApiHandlerFunction: 全prefix読み取り、uploads/raw/ への書き込み(presigned URL用)
        faxSystemBucket.grantRead(apiHandlerFunction)
        faxSystemBucket.grantPut(apiHandlerFunction, 'uploads/raw/*')
        documentsTable.grantReadWriteData(apiHandlerFunction) // タグ更新のため書き込み権限も必要
        
        // ApiHandlerFunction: Bedrock権限を追加
        apiHandlerFunction.addToRolePolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['bedrock:InvokeModel'],
                resources: [
                    'arn:aws:bedrock:ap-northeast-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0',
                ],
            })
        )

        // MailSendFunction: SES送信権限とS3読み取り(PDF添付用)
        faxSystemBucket.grantRead(mailSendFunction)
        mailSendFunction.addToRolePolicy(
            new iam.PolicyStatement({
                actions: ['ses:SendEmail', 'ses:SendRawEmail'],
                resources: [
                    `arn:aws:ses:${this.region}:${this.account}:identity/*`,
                ],
            })
        )

        // ImageOCRFunction: Textract権限
        imageOcrFunction.addToRolePolicy(
            new iam.PolicyStatement({
                actions: [
                    'textract:DetectDocumentText',
                    'textract:StartDocumentTextDetection',
                    'textract:GetDocumentTextDetection',
                ],
                resources: ['*'], // Textractは特定のリソースARNを持たない
            })
        )

        // S3 Event Notifications
        // uploads/raw/ にアップロードされた画像ファイルをトリガーにImageOCRFunctionを実行
        faxSystemBucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(imageOcrFunction),
            { prefix: 'uploads/raw/' }
        )

        // SES Email Receiving
        // SES受信ルールセットの作成
        const receiptRuleSet = new ses.ReceiptRuleSet(this, 'FaxMailReceiptRuleSet', {
            receiptRuleSetName: 'fax-mail-receipt-rules',
        })

        // SES受信ルール: メールをS3に保存してからLambdaを実行
        receiptRuleSet.addRule('FaxMailReceiptRule', {
            recipients: [], // 空の場合は全てのメールを受信
            scanEnabled: true, // スパム・ウイルススキャンを有効化
            actions: [
                // 1. S3にEMLファイルを保存
                new sesActions.S3({
                    bucket: faxSystemBucket,
                    objectKeyPrefix: 'ses-raw-mail/',
                }),
                // 2. MailIngestFunctionを呼び出し
                new sesActions.Lambda({
                    function: mailIngestFunction,
                }),
            ],
        })

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
        
        // タグ管理エンドポイント
        const tags = document.addResource('tags')
        tags.addMethod('PATCH', apiIntegration)
        
        // AI自動分類エンドポイント
        const classify = document.addResource('classify')
        classify.addMethod('POST', apiIntegration)

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
