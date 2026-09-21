import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const config = { runtime: 'edge' };

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-cache, no-transform',
};

const allowedModels = new Set(['gpt-4o-mini', 'gpt-4o']);
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
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const safeMessages = messages
      .filter((message) => message && ['user', 'assistant'].includes(message.role))
      .slice(-12)
      .map(({ role, content }) => ({ role, content: typeof content === 'string' ? content.slice(0, 2000) : '' }))
      .filter((message) => message.content);

    if (!safeMessages.length) return json({ error: 'A message is required.' }, 400);

    const result = streamText({
      model: openai(allowedModels.has(body.model) ? body.model : 'gpt-4o-mini'),
      system: systemPrompt,
      messages: safeMessages,
      maxTokens: 300,
    });

    // Deliberately use a plain UTF-8 text stream. The browser client reads chunks directly.
    return result.toTextStreamResponse({ headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' } });
  } catch (error) {
    console.error('Velopipe chat error', error);
    return json({ error: 'The assistant is temporarily unavailable.' }, 500);
  }
}
