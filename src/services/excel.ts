import * as XLSX from 'xlsx'

const REQUIRED_COLUMNS = ['Transaction No', 'Transaction Date', 'Amount', 'Bank', 'Sender Account No', 'Sender Name']

interface ParseResult {
  rows: Record<string, string | number>[]
  bank: string
  totalValid: number
  totalInvalid: number
  errors: string[]
}

export function parseExcel(buffer: ArrayBuffer): ParseResult {
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    return { rows: [], bank: '', totalValid: 0, totalInvalid: 0, errors: ['No sheets found in file'] }
  }

  const sheet = workbook.Sheets[sheetName]
  if (!sheet) {
    return { rows: [], bank: '', totalValid: 0, totalInvalid: 0, errors: ['Empty sheet'] }
  }
  const raw: Record<string, string | number>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  if (raw.length === 0) {
    return { rows: [], bank: '', totalValid: 0, totalInvalid: 0, errors: ['File has no data rows'] }
  }

  const headerKeys = Object.keys(raw[0]!)
  const headerMap = new Map<string, string>()
  for (const col of REQUIRED_COLUMNS) {
    const match = headerKeys.find((k) => k.trim().toLowerCase() === col.toLowerCase())
    if (match) {
      headerMap.set(col, match)
    }
  }

  const missing = REQUIRED_COLUMNS.filter((col) => !headerMap.has(col))
  if (missing.length > 0) {
    return {
      rows: [], bank: '', totalValid: 0, totalInvalid: 0,
      errors: [`Missing required columns: ${missing.join(', ')}`],
    }
  }

  let bank = ''
  const validRows: Record<string, string | number>[] = []
  const errors: string[] = []

  for (let i = 0; i < raw.length; i++) {
    const row = raw[i]!
    const txNo = String(row[headerMap.get('Transaction No')!] ?? '').trim()
    const dateVal = String(row[headerMap.get('Transaction Date')!] ?? '').trim()
    const amountVal = row[headerMap.get('Amount')!]

    if (!txNo || !dateVal || amountVal === '' || amountVal === undefined || amountVal === null) {
      errors.push(`Row ${i + 2}: missing required field`)
      continue
    }

    const amount = parseFloat(String(amountVal))
    if (isNaN(amount)) {
      errors.push(`Row ${i + 2}: invalid amount`)
      continue
    }

    const bankVal = String(row[headerMap.get('Bank')!] ?? '').trim().toUpperCase()
    if (!['BCA', 'MUFG', 'HSBC'].includes(bankVal)) {
      errors.push(`Row ${i + 2}: invalid bank "${bankVal}"`)
      continue
    }

    if (!bank) bank = bankVal
    else if (bank !== bankVal) {
      errors.push(`Row ${i + 2}: mismatched bank "${bankVal}", expected "${bank}"`)
      continue
    }

    const senderAccount = String(row[headerMap.get('Sender Account No')!] ?? '').trim()
    const senderName = String(row[headerMap.get('Sender Name')!] ?? '').trim()

    validRows.push({
      transactionNo: txNo,
      transactionDate: dateVal,
      amount,
      bank: bankVal,
      senderAccountNo: senderAccount,
      senderName,
    })
  }

  return {
    rows: validRows,
    bank,
    totalValid: validRows.length,
    totalInvalid: errors.length,
    errors,
  }
}
