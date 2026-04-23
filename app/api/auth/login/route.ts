import { NextRequest, NextResponse } from 'next/server'
import { setAdminCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  setAdminCookie()
  return NextResponse.json({ ok: true })
}
