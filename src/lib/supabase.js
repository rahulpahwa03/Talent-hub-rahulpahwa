import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : '')
const supabaseKey = process.env.SUPABASE_ANON_KEY || (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : '')

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;