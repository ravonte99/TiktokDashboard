import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Construct the system prompt with context
    const systemPrompt = `You are a helpful AI assistant for a content dashboard. 
The user has selected the following context boxes to help answer their question:
${JSON.stringify(context, null, 2)}

When answering, refer to these specific resources if relevant. 
If the user asks about the content of the links (YouTube/TikTok), explain that you can only see the titles and URLs provided in the context, unless you have internal knowledge of popular content.
Keep your answers concise and helpful.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    });

    const reply = completion.choices[0].message.content;

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during the request' },
      { status: 500 }
    );
  }
}

