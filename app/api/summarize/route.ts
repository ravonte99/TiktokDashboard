import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { links, boxName, boxDescription } = await req.json();

    if (!links || !Array.isArray(links)) {
      return NextResponse.json({ error: 'Links are required' }, { status: 400 });
    }

    const prompt = `You are a Content Analyst AI. 
Your task is to analyze a collection of resources (videos/posts) in a category called "${boxName}"${boxDescription ? ` (Description: ${boxDescription})` : ''}.

Here are the resources:
${links.map((l: any, i: number) => `${i+1}. [${l.type}] ${l.title || 'Untitled'} (${l.url}) - ${l.description || ''}`).join('\n')}

Please generate a concise but insightful summary (max 150 words) of what this collection represents. 
Highlight common themes, specific topics covered, or the potential "vibe" of this content. 
This summary will be used to provide context to another AI chatbot.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Switch to Flash for summarization to avoid Rate Limits

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Google AI Summary Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during summarization' },
      { status: 500 }
    );
  }
}
