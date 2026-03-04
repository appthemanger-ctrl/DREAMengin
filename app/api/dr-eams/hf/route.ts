import { NextResponse } from 'next/server';
import { z } from 'zod';

const BodySchema = z.object({
  message: z.string().min(1).max(8000),
});

export async function POST(req: Request) {
  try {
    const body = BodySchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: 'Invalid request', details: body.error.flatten() }, { status: 400 });
    }

    const token = process.env.HF_API_TOKEN;
    const model = process.env.HF_MODEL;
    if (!token || !model) {
      return NextResponse.json(
        {
          error: 'Hugging Face not configured',
          hint: 'Set HF_API_TOKEN and HF_MODEL in your environment.',
        },
        { status: 501 }
      );
    }

    const prompt = [
      'You are Dr. Eams, the user-facing theorist & builder for DREAMengin.',
      'Follow the DREAMengin Production Spec. Be concise and actionable.',
      '',
      `User: ${body.data.message}`,
      'Dr. Eams:',
    ].join('\n');

    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 256,
          temperature: 0.6,
          return_full_text: false,
        },
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(
        {
          error: 'Hugging Face request failed',
          status: res.status,
          details: data,
        },
        { status: 502 }
      );
    }

    const text =
      (Array.isArray(data) && data[0]?.generated_text) ||
      (data && typeof data === 'object' && 'generated_text' in data && (data as any).generated_text);

    return NextResponse.json({ reply: typeof text === 'string' ? text.trim() : JSON.stringify(data) });
  } catch (e) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
