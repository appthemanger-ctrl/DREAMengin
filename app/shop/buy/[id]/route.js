import { createServerClient } from '../../../../lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(req, { params }) {
  const supabase = createServerClient()
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!product) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500 })
  }

  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

  const origin = req.headers.get('origin') || 'http://localhost:3000'
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: product.title },
        unit_amount: product.price_int,
      },
      quantity: 1,
    }],
    success_url: `${origin}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop`,
  })

  return new Response(JSON.stringify({ url: session.url }), { headers: { 'content-type': 'application/json' } })
}
