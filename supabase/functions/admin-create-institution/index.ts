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

    const { schoolName, schoolType, city, adminName, adminEmail, adminPassword } = await req.json()

    // 1. Criar Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { name: adminName, role: 'super_admin' }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = authData.user.id

    // 2. Insert into institutions
    const { data: instData, error: instError } = await supabase
      .from('institutions')
      .insert({
        name: schoolName,
        school_type: schoolType
      })
      .select()
      .single()

    if (instError) {
      console.error('Error inserting institution:', instError)
      // Cleanup the user if institution fails
      await supabase.auth.admin.deleteUser(userId)
      return new Response(JSON.stringify({ error: 'Falha ao criar instituição. ' + instError.message }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const institutionId = instData.id

    // 3. Update or Insert into public.users
    // Since we created the auth user, a trigger might have already inserted them into public.users.
    // Let's check if the user exists first.
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
          name: adminName,
          role: 'super_admin',
          institution_id: institutionId
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
          email: adminEmail,
          name: adminName,
          role: 'super_admin',
          institution_id: institutionId,
          must_change_password: false
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

    // Return the final user data matching the frontend's expectations
    return new Response(JSON.stringify({
      user: {
        id: finalUser.id,
        name: finalUser.name,
        email: finalUser.email,
        role: finalUser.role,
        institutionId: finalUser.institution_id,
        schoolName: instData.name,
        schoolType: instData.type
      }
    }), {
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
