import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const config = { runtime: 'edge' };

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Or restrict to 'https://innovatrix-cbadc.web.app'
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-cache, no-transform',
};

const OPENROUTER_MODEL = 'qwen/qwen3.8-27b-chat';

const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://innovatrix-cbadc.web.app',
    'X-Title': process.env.OPENROUTER_APP_NAME || 'Velopipe Assistant',
  },
});

const systemPrompt = `You are the Velopipe Assistant. You are restricted to the functions and content of the site's original assistant:
- Help visitors jump to these page sections: Electronics Line Cards, Automotive Innovations, Aviation Research, Industrial Software / AI, and Green Hydrogen Data.
- Help visitors download Strategy Map (PDF), Model Canvas (PDF), and AI Blog (PDF).
- Explain that the site can open the External Integrations links for OpenAI, Manus AI, and Zoho.
- For tailor-made solutions, provide enterprise1@vishnucr9.org.
You may be polished and conversational, but do not answer general questions, invent website content, browse, claim to download or navigate on the user's behalf, expose implementation details, or provide capabilities outside that list. Direct unrelated requests back to those site functions. Keep answers concise.`;

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export default async function handler(req) {
  // Handle CORS preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    
    const safeMessages = messages
      .filter((message) => message && ['user', 'assistant'].includes(message.role))
      .slice(-12)
      .map(({ role, content }) => ({
        role,
        content: typeof content === 'string' ? content.slice(0, 2000) : '',
      }))
      .filter((message) => message.content);

    if (!safeMessages.length) {
      return json({ error: 'A message is required.' }, 400);
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return json({ error: 'The assistant is not configured on the server.' }, 503);
    }

    const result = streamText({
      model: openrouter(OPENROUTER_MODEL),
      system: systemPrompt,
      messages: safeMessages,
      maxTokens: 300,
    });

    return result.toTextStreamResponse({
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/plain; charset=utf-8' 
      },
    });
  } catch (error) {
    console.error('Velopipe chat error:', error);
    return json({ error: 'The assistant is temporarily unavailable.' }, 500);
  }
}