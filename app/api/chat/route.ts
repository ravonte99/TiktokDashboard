import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

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

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemPrompt
    });

    // Convert OpenAI message format (user/assistant) to Gemini format (user/model)
    // Gemini requires history to not include the last message if using sendMessage
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    
    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const reply = response.text();

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Google AI API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during the request' },
      { status: 500 }
    );
  }
}
