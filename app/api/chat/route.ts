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

    // Construct context string from Summaries + Links
    const contextString = context.map((box: any) => {
      let boxContent = `Box: ${box.name}`;
      if (box.aiSummary) {
        boxContent += `\nAI Context Summary: ${box.aiSummary}`;
      }
      // Still include links just in case, but the summary is primary
      if (box.links && box.links.length > 0) {
        boxContent += `\nResources: ${box.links.map((l: any) => `- ${l.title || l.url}`).join(', ')}`;
      }
      return boxContent;
    }).join('\n\n');

    const systemPrompt = `You are a helpful AI assistant for a content dashboard. 
The user has selected the following context boxes. Use the "AI Context Summary" for each box as the primary source of truth for what the content is about.

${contextString}

When answering, synthesize information from these summaries.
If the user asks about specific details not in the summary, look at the resource titles.
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
