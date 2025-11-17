// backend/src/lib/pdfGenerator.ts
import PDFDocument from 'pdfkit'
import sharp from 'sharp'

/**
 * 画像（Buffer配列）から単一のPDFを生成して Buffer を返す
 * - 1画像 = 1ページ
 * - sharp で一旦 PNG に正規化してから pdfkit に渡す
 */
export const generatePdfFromImages = async (images: Buffer[]): Promise<Buffer> => {
    if (images.length === 0) {
        throw new Error('No images provided for PDF generation')
    }

    // 画像を PNG に正規化
    const normalizedImages = await Promise.all(images.map((img) => sharp(img).png().toBuffer()))

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ autoFirstPage: false })
            const chunks: Buffer[] = []

            doc.on('data', (chunk) => chunks.push(chunk))
            doc.on('end', () => resolve(Buffer.concat(chunks)))
            doc.on('error', (err) => {
                console.error('PDF generation error', err)
                reject(err)
            })

            // A4相当サイズ（pt）
            const pageWidth = 595.28
            const pageHeight = 841.89

            for (const img of normalizedImages) {
                doc.addPage({ size: [pageWidth, pageHeight] })
                doc.image(img, 0, 0, {
                    fit: [pageWidth, pageHeight],
                    align: 'center',
                    valign: 'center',
                })
            }

            doc.end()
        } catch (err) {
            reject(err)
        }
    })
}
