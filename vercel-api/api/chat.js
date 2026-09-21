import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
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

    const result = await streamText({
      model: openai('gpt-4o-mini'), 
      system: `You are the official Velopipe Assistant. You help users navigate pipelines, documentation, platform features, and downloads. Be professional, concise, and helpful.`,
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

