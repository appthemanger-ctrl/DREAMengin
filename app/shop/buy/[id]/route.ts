
import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest, { params }:{ params:{ id:string } }){
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error:'Stripe not configured' }, { status: 501 })
  return NextResponse.json({ error:'Stripe integration not included in this bundle' }, { status: 501 })
}
