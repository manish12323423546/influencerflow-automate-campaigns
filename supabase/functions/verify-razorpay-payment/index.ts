
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentData } = await req.json()

    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret key not configured')
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = hmac("sha256", razorpayKeySecret, body, "utf8", "hex")

    if (expectedSignature !== razorpay_signature) {
      throw new Error('Invalid payment signature')
    }

    // Get user
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Update payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .update({
        status: 'completed',
        razorpay_payment_id,
        razorpay_order_id,
        paid_at: new Date().toISOString()
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('brand_user_id', user.id)
      .select()
      .single()

    if (paymentError) {
      throw paymentError
    }

    // Update milestone if applicable
    if (paymentData.milestoneId) {
      await supabaseClient
        .from('payment_milestones')
        .update({
          status: 'paid',
          payment_id: payment.id
        })
        .eq('id', paymentData.milestoneId)
    }

    return new Response(JSON.stringify({ success: true, payment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Payment verification error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
