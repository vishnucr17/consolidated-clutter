import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const config = {
  runtime: 'edge', 
};

export default async function handler(req) {
  // 1. Set up CORS so your frontend can communicate across domains
  const headers = {
    'Access-Control-Allow-Origin': '*', 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const { messages } = await req.json();

    // 2. Query GPT Mini using Vercel AI SDK
    const result = await streamText({
      model: openai('gpt-4o-mini'), // Note: adjust to your specific Vercel-allotted models
      messages,
    });

    return result.toDataStreamResponse({ headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers 
    });
  }
}
