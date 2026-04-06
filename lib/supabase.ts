import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: string) {
    if (!_client) {
      _client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
    const val = (_client as unknown as Record<string, unknown>)[prop]
    return typeof val === 'function' ? val.bind(_client) : val
  },
})
