// @ts-ignore: Supabase Edge Functions import, only available in Deno runtime
import { serve } from 'jsr:@supabase/functions-js'
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Create the Supabase Edge Function handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency = 'INR', receipt, campaignId, influencerId, contractId, milestoneId } = await req.json()

    const razorpayKeyId = 'rzp_test_iZbabM5Zru76Fd'
    // @ts-ignore
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!razorpayKeySecret) {
      throw new Error('Razorpay secret key not configured')
    }

    // Check if a payment already exists for this contract
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    // @ts-ignore
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    if (contractId) {
      const { data: existingPayments, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('contract_id', contractId)
        .eq('status', 'completed')

      if (paymentError) {
        console.error('Error checking existing payments:', paymentError)
      } else if (existingPayments && existingPayments.length > 0) {
        return new Response(JSON.stringify({ 
          error: 'Payment already exists for this contract',
          existingPayment: existingPayments[0]
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
      }
    }

    // Create Razorpay order
    const orderData = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        campaignId: campaignId || '',
        influencerId: influencerId || '',
        contractId: contractId || '',
        milestoneId: milestoneId || ''
      }
    }

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(razorpayKeyId + ':' + razorpayKeySecret)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      throw new Error(`Razorpay API error: ${response.statusText}`)
    }

    const order = await response.json()
    
    return new Response(JSON.stringify(order), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
