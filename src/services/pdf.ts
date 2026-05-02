import PDFDocument from 'pdfkit'

interface ReceiptData {
  receiptNo: string
  receiptDate: string
  clientName: string
  transactionNo: string
  bank: string
  transactionDate: string
  amount: string
  senderAccountNo: string
  senderName: string
}

export function generateReceiptPdf(data: ReceiptData): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))

    doc.fontSize(18).text('PT Finance Receipt', { align: 'center' })
    doc.fontSize(12).text('Official Receipt', { align: 'center' })
    doc.moveDown(1)

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke()
    doc.moveDown(0.5)

    doc.fontSize(10)
    doc.text(`Receipt No: ${data.receiptNo}`)
    doc.text(`Date: ${data.receiptDate}`)
    doc.text(`Client: ${data.clientName}`)
    doc.moveDown(0.5)

    doc.text(`Transaction No: ${data.transactionNo}`)
    doc.text(`Bank: ${data.bank}`)
    doc.text(`Transaction Date: ${data.transactionDate}`)
    doc.moveDown(0.5)

    doc.text(`Amount: IDR ${Number(data.amount).toLocaleString('id-ID')}`)
    doc.moveDown(0.5)

    doc.text(`Sender Account: ${data.senderAccountNo}`)
    doc.text(`Sender Name: ${data.senderName}`)

    doc.end()
  })
}
