import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'
import { corsHeaders } from '../shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase env vars')
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { name, email, password, role, institutionId, registrationNumber } = await req.json()

    // 1. Criar Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = authData.user.id

    // 2. Update or Insert into public.users
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    let finalUser = null

    if (existingUser) {
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name,
          role,
          institution_id: institutionId,
          must_change_password: true // Always true for created users by admin
        })
        .eq('id', userId)
        .select()
        .single()
      
      if (updateError) {
         console.error('Error updating user:', updateError)
         return new Response(JSON.stringify({ error: 'Falha ao atualizar usuário. ' + updateError.message }), {
           status: 200,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' }
         })
      }
      finalUser = updatedUser
    } else {
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          name,
          role,
          institution_id: institutionId,
          must_change_password: true
        })
        .select()
        .single()
      
      if (insertError) {
         console.error('Error inserting user:', insertError)
         return new Response(JSON.stringify({ error: 'Falha ao inserir usuário. ' + insertError.message }), {
           status: 200,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' }
         })
      }
      finalUser = insertedUser
    }

    return new Response(JSON.stringify({ user: finalUser }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('Edge Function Error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
