import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    await supabase.from('todos').delete().eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete todo' }, { status: 500 })
  }
}