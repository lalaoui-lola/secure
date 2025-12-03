import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ebhheixoxtaemqicuxly.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViaGhlaXhveHRhZW1xaWN1eGx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODI3OTEsImV4cCI6MjA3OTc1ODc5MX0.d4mJzcaWsNsMKB2EiwIh_ljdPJkVUwyuvcN00iYwxXE'

export const supabase = createClient(supabaseUrl, supabaseKey)
