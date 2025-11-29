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

Please create a "Context Profile" for this collection.
The goal is NOT just to summarize, but to extract key intelligence that will help another AI Assistant understand the user's intent, style, and preferences represented by this box.

Focus on:
1. Core Themes & Topics (What is this actually about?)
2. Content Style/Vibe (e.g., educational, chaotic, aesthetic, minimal, high-energy)
3. Key Entities (Specific people, brands, tools, or formats mentioned)
4. Strategic Value (Inferred reason for saving: e.g., "Editing inspiration", "Competitor research", "Trending audio")

Format as a concise, information-dense paragraph (max 200 words) that serves as "System Instructions" for the other AI. Do not use bullet points, just a dense, rich paragraph.`;

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
