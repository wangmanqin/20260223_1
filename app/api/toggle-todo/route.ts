import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/api'

export async function POST(request: NextRequest) {
  try {
    const { id, completed } = await request.json()
    
    const { supabase, response } = createClient(request)

    await supabase.from('todos').update({ completed: !completed }).eq('id', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error toggling todo:', error)
    return NextResponse.json({ success: false, error: 'Failed to toggle todo' }, { status: 500 })
  }
}