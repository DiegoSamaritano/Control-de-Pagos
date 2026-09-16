// URL base del proyecto (sin /rest/v1/)
const SUPABASE_URL = 'https://nfcuubksoevtaxfhsipm.supabase.co';

// Clave pública anon limpia (sin prefijos)
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mY3V1Ymtzb2V2dGF4ZmhzaXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NjgwOTYsImV4cCI6MjEwNTE0NDA5Nn0.W_JAa5Ss_FoOq7NCqH8hH6OzFWsdEOgc0caTv9MSbec';

// Inicialización única del cliente
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);