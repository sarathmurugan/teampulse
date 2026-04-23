import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: { code: string } }
) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('code', params.code.toUpperCase())
    .single()

  if (error) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  return NextResponse.json(data)
}
