import React, { useState } from 'react'
import { sendEmail } from '../../api/emailsApi.ts'

interface EmailSendModalProps {
    isOpen: boolean
    onClose: () => void
}

const EmailSendModal: React.FC<EmailSendModalProps> = ({ isOpen, onClose }) => {
    const [to, setTo] = useState('')
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [sending, setSending] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setSending(true)
            await sendEmail({ to, subject, body })
            alert('メール送信成功！')
            onClose()
            setTo('')
            setSubject('')
            setBody('')
        } catch (error) {
            console.error('Send email error:', error)
            alert('メール送信失敗')
        } finally {
            setSending(false)
        }
    }

    if (!isOpen) return null

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '2rem',
                    width: '90%',
                    maxWidth: '600px',
                }}
            >
                <h2 style={{ marginBottom: '1.5rem' }}>メール送信</h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>宛先:</label>
                        <input
                            type="email"
                            value={to}
                            onChange={e => setTo(e.target.value)}
                            style={{ width: '100%' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>件名:</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            style={{ width: '100%' }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>本文:</label>
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            rows={8}
                            style={{ width: '100%' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="submit" disabled={sending}>
                            {sending ? '送信中...' : '送信'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ backgroundColor: '#6c757d' }}
                        >
                            キャンセル
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EmailSendModal
