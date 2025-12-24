'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClientServer } from '@/lib/supabase'

export async function login(formData: FormData) {
    const supabase = await createClientServer()

    // Type-casting here for convenience
    // In a real app, you might want to validate more strictly with Zod
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        redirect('/login?error=Invalid credentials')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClientServer()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        redirect('/login?error=Could not sign up')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
