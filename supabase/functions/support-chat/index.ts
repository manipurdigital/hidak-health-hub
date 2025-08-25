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
      console.warn('OpenAI API key not configured; OpenAI provider will be skipped.');
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

    console.log('Starting support chat request...');

    const groqApiKey = Deno.env.get('GROQ_API_KEY');

    // Rules-based fallback for common questions
    const getRulesBasedResponse = (userMessage: string): string => {
      const message = userMessage.toLowerCase();
      
      if (message.includes('order') && (message.includes('track') || message.includes('status'))) {
        return "To track your order, you can find your order status in the 'My Orders' section of your account. If you need immediate assistance with a specific order, please contact our support team with your order number.";
      }
      
      if (message.includes('lab') && (message.includes('test') || message.includes('book'))) {
        return "You can book lab tests through our platform by browsing available tests and selecting home collection. Our team will contact you to schedule the sample collection at your convenience.";
      }
      
      if (message.includes('medicine') && (message.includes('deliver') || message.includes('order'))) {
        return "We deliver medicines to your doorstep. You can upload prescriptions or browse OTC medications. Our pharmacists verify all prescriptions before dispatch.";
      }
      
      if (message.includes('payment') || message.includes('refund')) {
        return "We accept various payment methods including cards, UPI, and wallets. For refunds, please check your order status or contact support with your order details.";
      }
      
      if (message.includes('contact') || message.includes('support') || message.includes('help')) {
        return "You can reach our support team through this chat, email, or phone. We're here to help with any questions about orders, lab tests, medicines, or technical issues.";
      }
      
      return "I'm here to help with questions about lab tests, medicine orders, tracking, payments, and platform usage. For specific account or order issues, please provide more details or contact our support team directly.";
    };

    // Helpers for AI providers
    const attemptGroq = async () => {
      if (!groqApiKey) throw new Error('Groq API key not configured');
      console.log('Calling Groq API...');
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: chatMessages,
          max_tokens: 500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API error:', response.status, response.statusText);
        console.error('Error details:', errorText);
        throw new Error(`groq_${response.status}:${errorText}`);
      }

      const data = await response.json();
      console.log('Groq response received');
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('No response from Groq');
      return { message: content, usage: data.usage, provider: 'groq' } as const;
    };

    const attemptOpenAI = async () => {
      if (!openAIApiKey) throw new Error('OpenAI API key not configured');
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

    let result: { message: string; usage?: unknown; provider: string } | null = null;

    try {
      // Try Groq first (free)
      result = await attemptGroq();
    } catch (groqErr) {
      console.error('Groq failed, trying OpenAI fallback:', groqErr);
      try {
        // Try OpenAI as fallback
        result = await attemptOpenAI();
      } catch (openAiErr) {
        console.error('OpenAI fallback also failed, using rules-based response:', openAiErr);
        // Use rules-based fallback
        const userMessage = messages[messages.length - 1]?.content || '';
        const rulesResponse = getRulesBasedResponse(userMessage);
        result = { 
          message: rulesResponse, 
          usage: null, 
          provider: 'rules-based' 
        };
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