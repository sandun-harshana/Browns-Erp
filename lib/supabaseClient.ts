import { createClient } from '@supabase/supabase-js'

const supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://fallback.supabase.co'
const supabaseAnonKey: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'fallback-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
