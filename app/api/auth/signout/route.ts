import { createClientServer } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export async function POST(request: Request) {
    const supabase = await createClientServer()
    await supabase.auth.signOut()
    return redirect('/login')
}
