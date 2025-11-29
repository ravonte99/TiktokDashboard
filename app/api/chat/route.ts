import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Helper: The "Box Agent" - An expert on one specific box
async function queryBoxAgent(box: any, question: string) {
  // Use a fast, cost-effective model for the sub-agents
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 
  
  let contextContent = `You are an expert analyst for a specific collection of content named "${box.name}".\n`;
  if (box.description) contextContent += `Collection Description: ${box.description}\n`;
  if (box.aiSummary) contextContent += `Summary of Content: ${box.aiSummary}\n`;
  
  contextContent += `\nHere is the list of resources in this collection:\n`;
  if (box.links && box.links.length > 0) {
    box.links.forEach((l: any, i: number) => {
        contextContent += `${i+1}. [${l.type}] ${l.title || 'Untitled'} (${l.url})\n`;
        if (l.description) contextContent += `   Details: ${l.description.substring(0, 300)}...\n`; // Truncate long descriptions for context window efficiency
    });
  } else {
    contextContent += "No specific links in this box.\n";
  }

  const prompt = `Context:\n${contextContent}\n\nUser Question: ${question}\n\nAnswer the question based ONLY on the context provided above. Be concise and specific. If the answer isn't in the context, say so.`;
  
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) {
    console.error(`Box Agent error for ${box.name}:`, e);
    return `Error analyzing box ${box.name}.`;
  }
}

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    console.log('--- Agentic Chat Request Started ---');
    console.log('User Message:', messages[messages.length - 1].content);
    console.log('Context Boxes Available:', context.map((b: any) => b.name).join(', '));

    // 1. Define the Tool for the Manager
    const askBoxTool = {
      name: "ask_box",
      description: "Ask a specific question to a 'Context Box' (a category of videos/links) to get detailed information from it. Use this when you need to know about the specific contents, themes, or details within a category.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          box_id: {
            type: SchemaType.STRING,
            description: "The ID of the box to query. (Choose from the available boxes list)",
          },
          question: {
            type: SchemaType.STRING,
            description: "The specific question to ask this box agent.",
          },
        },
        required: ["box_id", "question"],
      },
    };

    // 2. Prepare the Manager Model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-pro-preview",
      systemInstruction: {
        parts: [{ text: `You are a Content Dashboard Manager AI.
You have access to the following "Context Boxes":
${context.map((b: any) => `- Name: "${b.name}" (ID: "${b.id}"): ${b.description || ''}`).join('\n')}

Your goal is to answer the user's questions by orchestrating these contexts.
- **ALWAYS** use the 'ask_box' tool to get information. Do not guess what is in the boxes.
- You can call 'ask_box' multiple times (e.g., to compare Box A and Box B).
- If the user asks "What is in my Inspiration box?", call ask_box(inspiration_id, "Summarize the contents").
- Synthesize the results from the tool calls into a helpful final answer.
` }]
      },
      tools: [{ functionDeclarations: [askBoxTool] }],
    });

    // 3. Prepare History for Gemini
    // Gemini format: { role: 'user' | 'model', parts: [{ text: ... }] }
    // We need to filter out tool calls from previous turns if we aren't persisting them perfectly, 
    // but for this simple chat interface, we'll just map text content.
    // NOTE: Ideally, we should persist the tool calls in chat history for multi-turn context, 
    // but simpler approach for now: Feed text history, start new turn.
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    const chat = model.startChat({ history });

    // 4. Send User Message & Handle Tool Loop
    let result = await chat.sendMessage(lastMessage.content);
    let response = await result.response;
    let functionCalls = response.functionCalls();

    if (!functionCalls || functionCalls.length === 0) {
        console.log('Manager decided NOT to call any tools for this request.');
    }

    // Limit max turns to prevent infinite loops
    let turns = 0;
    const MAX_TURNS = 5;

    while (functionCalls && functionCalls.length > 0 && turns < MAX_TURNS) {
      turns++;
      const functionResponses = [];

      for (const call of functionCalls) {
        if (call.name === 'ask_box') {
          const { box_id, question } = call.args as any;
          const targetBox = context.find((b: any) => b.id === box_id);
          
          let toolResult;
          if (targetBox) {
            console.log(`Manager asking Box "${targetBox.name}": ${question}`);
            toolResult = await queryBoxAgent(targetBox, question);
            console.log(`Box "${targetBox.name}" replied:`, toolResult);
          } else {
            console.warn(`Manager tried to ask unknown Box ID: ${box_id}`);
            toolResult = `Error: Box with ID ${box_id} not found.`;
          }

          functionResponses.push({
            functionResponse: {
              name: 'ask_box',
              response: { result: toolResult }
            }
          });
        }
      }

      // Feed tool results back to the model
      result = await chat.sendMessage(functionResponses);
      response = await result.response;
      functionCalls = response.functionCalls();
    }

    const reply = response.text();
    console.log('--- Agentic Chat Request Finished ---');
    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error('Agentic Chat Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during the agent workflow' },
      { status: 500 }
    );
  }
}
