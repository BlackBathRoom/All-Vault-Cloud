import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { sesClient } from '../lib/sesClient'
import { SendEmailCommand } from '@aws-sdk/client-ses'

const SENDER_EMAIL = process.env.SENDER_EMAIL || ''

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('MailSend function triggered', JSON.stringify(event))

    try {
        const body = JSON.parse(event.body || '{}')
        const { to, subject, body: emailBody } = body

        if (!to || !subject || !emailBody) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing required fields: to, subject, body' }),
            }
        }

        const command = new SendEmailCommand({
            Source: SENDER_EMAIL,
            Destination: {
                ToAddresses: [to],
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: 'UTF-8',
                },
                Body: {
                    Text: {
                        Data: emailBody,
                        Charset: 'UTF-8',
                    },
                },
            },
        })

        await sesClient.send(command)

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Email sent successfully' }),
        }
    } catch (error) {
        console.error('Error sending email:', error)
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to send email', error: String(error) }),
        }
    }
}
