import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `You are a helpful support assistant for a healthcare platform that provides:
- Lab test bookings and home collection
- Medicine delivery from pharmacies
- Doctor consultations (when enabled)
- Order tracking and management
- Subscription services for healthcare

Guidelines:
- Be friendly, empathetic, and professional
- For medical advice, always direct users to book a consultation with a doctor
- Help users navigate the platform and understand services
- For specific order/booking issues, guide them to contact human support
- Keep responses concise but helpful
- If you don't know something specific, suggest contacting support

Available services:
- Lab Tests: Home collection, various test packages
- Medicines: Prescription and OTC medication delivery
- Order Management: Track orders, refunds, cancellations
- Subscriptions: Healthcare plans and benefits

Don't share sensitive information or make medical diagnoses. Always prioritize user safety.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Support chat request received');
    
    const { messages, user, topic } = await req.json();
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare messages for OpenAI
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // Add user context if available
    if (user?.id || user?.email) {
      chatMessages[0].content += `\n\nUser context: ${user.email ? `Email: ${user.email}` : ''} ${user.id ? `ID: ${user.id}` : ''}`;
    }

    if (topic) {
      chatMessages[0].content += `\n\nUser selected topic: ${topic}`;
    }

    console.log('Calling OpenAI API...');

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

    // Helpers for providers
    const attemptOpenAI = async () => {
      if (!openAIApiKey) throw new Error('OpenAI API key not configured');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini-2025-08-07',
          messages: chatMessages,
          max_completion_tokens: 500,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, response.statusText);
        console.error('Error details:', errorText);
        throw new Error(`openai_${response.status}:${errorText}`);
      }

      const data = await response.json();
      console.log('OpenAI response received');
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');
      return { message: content, usage: data.usage, provider: 'openai' } as const;
    };

    const attemptPerplexity = async () => {
      if (!perplexityApiKey) throw new Error('PERPLEXITY_API_KEY not configured');
      console.log('Falling back to Perplexity API...');
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: chatMessages,
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 600,
          frequency_penalty: 1,
          presence_penalty: 0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Perplexity API error:', response.status, response.statusText);
        console.error('Error details:', errorText);
        throw new Error(`perplexity_${response.status}:${errorText}`);
      }

      const data = await response.json();
      console.log('Perplexity response received');
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('No response from Perplexity');
      return { message: content, usage: data.usage, provider: 'perplexity' } as const;
    };

    let result: { message: string; usage?: unknown; provider: string } | null = null;

    try {
      result = await attemptOpenAI();
    } catch (openAiErr) {
      console.error('OpenAI failed, will try fallback if available:', openAiErr);
      try {
        result = await attemptPerplexity();
      } catch (fallbackErr) {
        console.error('Perplexity fallback also failed:', fallbackErr);
        // Re-throw the original OpenAI error to keep context
        throw openAiErr;
      }
    }

    return new Response(JSON.stringify({ 
      message: result.message,
      usage: result.usage,
      provider: result.provider,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in support-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Sorry, I encountered an error. Please try again or contact our support team.' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});