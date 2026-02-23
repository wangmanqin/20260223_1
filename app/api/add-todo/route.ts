import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/api'

export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json()
    const { supabase, response } = createClient(request)

    const { error } = await supabase.from('todos').insert({ title })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding todo:', error)
    return NextResponse.json({ success: false, error: 'Failed to add todo' }, { status: 500 })
  }
}