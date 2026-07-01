import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export interface Article {
  id: number
  zendesk_id: number
  title: string
  body: string
  category_id: number
  category_name: string
  section_id: number
  section_name: string
  label_names: string[]
  promoted: boolean
  draft: boolean
  view_count: number
  status: string
  country_tags: string[]
  source_urls: string[]
  zendesk_url: string
  updated_at: string
  created_at: string
}

export interface Category {
  id: number
  zendesk_id: number
  name: string
  description: string
  position: number
}

export interface Section {
  id: number
  zendesk_id: number
  category_id: number
  name: string
  description: string
  position: number
}

export interface SourceUrl {
  id: number
  url: string
  name: string
  description: string
  last_fetched_at: string
  created_at: string
}
