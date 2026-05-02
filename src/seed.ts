import { db } from './db/index'
import { clients, users } from './db/schema'

const mockClients = [
  { clientCode: 'CLT-001', clientName: 'PT Maju Bersama', bankAccountNo: '1234567890', bankName: 'BCA' },
  { clientCode: 'CLT-002', clientName: 'CV Sejahtera Abadi', bankAccountNo: '2345678901', bankName: 'BCA' },
  { clientCode: 'CLT-003', clientName: 'PT Karya Nusantara', bankAccountNo: '3456789012', bankName: 'BCA' },
  { clientCode: 'CLT-004', clientName: 'CV Mitra Utama', bankAccountNo: '4567890123', bankName: 'BCA' },
  { clientCode: 'CLT-005', clientName: 'PT Global Indo', bankAccountNo: '5678901234', bankName: 'MUFG' },
  { clientCode: 'CLT-006', clientName: 'CV Sentosa Makmur', bankAccountNo: '6789012345', bankName: 'MUFG' },
  { clientCode: 'CLT-007', clientName: 'PT Prima Teknik', bankAccountNo: '7890123456', bankName: 'MUFG' },
  { clientCode: 'CLT-008', clientName: 'CV Cahaya Timur', bankAccountNo: '8901234567', bankName: 'MUFG' },
  { clientCode: 'CLT-009', clientName: 'PT Bumi Resources', bankAccountNo: '9012345678', bankName: 'HSBC' },
  { clientCode: 'CLT-010', clientName: 'CV Anugerah Jaya', bankAccountNo: '0123456789', bankName: 'HSBC' },
  { clientCode: 'CLT-011', clientName: 'PT Lintas Media', bankAccountNo: '1122334455', bankName: 'HSBC' },
  { clientCode: 'CLT-012', clientName: 'CV Berkat Abadi', bankAccountNo: '2233445566', bankName: 'HSBC' },
]

async function seed() {
  for (const client of mockClients) {
    await db.insert(clients).values(client)
  }
  console.log(`Seeded ${mockClients.length} clients`)

  const passwordHash = await Bun.password.hash('password123')
  await db.insert(users).values({
    id: crypto.randomUUID().slice(0, 21),
    username: 'testuser',
    passwordHash,
  })
  console.log('Seeded test user: testuser / password123')

  process.exit(0)
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
