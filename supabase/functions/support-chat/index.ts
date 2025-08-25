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
      console.error('OpenAI API error:', response.status, response.statusText);
      const errorData = await response.text();
      console.error('Error details:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('No response from OpenAI');
    }

    const assistantMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      message: assistantMessage,
      usage: data.usage 
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