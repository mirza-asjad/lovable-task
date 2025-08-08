import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Configuration and Constants
const CONFIG = {
  RESEND_KEY: Deno.env.get("RESEND_PUBLIC_KEY") || "invalid_key",
  OPENAI_KEY: Deno.env.get('OPENAI_API_KEY'),
  EMAIL_FROM: "Innovation Community <testing-email@lovable.dev>",
  AI_MODEL: 'gpt-4o-mini',
  MAX_TOKENS: 200,
  TEMPERATURE: 0.8,
  CONTENT_LIMIT: 150
};

const HTTP_HEADERS = {
  CORS: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  },
  JSON: { "Content-Type": "application/json" }
};

// Types
type EmailRequest = {
  name: string;
  email: string;
  industry: string;
};

type AIResponse = {
  choices: Array<{ message: { content: string } }>;
};

// Initialize Resend client
const emailClient = new Resend(CONFIG.RESEND_KEY);

/**
 * Creates AI-powered personalized welcome content
 */
async function createPersonalizedWelcomeMessage(recipientName: string, userIndustry: string): Promise<string> {
  try {
    console.log("Initiating AI content generation...");
    
    const aiRequest = {
      model: CONFIG.AI_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a specialist in crafting dynamic, personalized welcome messages for an elite innovation community. Generate compelling, energetic content that inspires recipients about transforming their industry. Keep total length under ${CONFIG.CONTENT_LIMIT} words.`
        },
        {
          role: 'user',
          content: `Craft an inspiring welcome message for ${recipientName} from the ${userIndustry} sector. Highlight how our innovation community will empower them to revolutionize their specific field. Be motivational and industry-focused, mentioning relevant opportunities and breakthrough innovations they can participate in.`
        }
      ],
      temperature: CONFIG.TEMPERATURE,
      max_tokens: CONFIG.MAX_TOKENS
    };

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiRequest),
    });

    const responseData: AIResponse = await aiResponse.json();
    console.log('AI response received:', responseData);
    
    return responseData?.choices[0]?.message?.content || generateFallbackMessage(recipientName, userIndustry);
  } catch (err) {
    console.error('AI content generation failed:', err);
    return generateFallbackMessage(recipientName, userIndustry);
  }
}

/**
 * Generates fallback content when AI is unavailable
 */
function generateFallbackMessage(name: string, industry: string): string {
  return `Hello ${name}! 🌟 Welcome to our innovation community! We're excited to have a ${industry} professional join our network. Prepare to explore breakthrough technologies, collaborate with industry pioneers, and discover game-changing opportunities that will reshape your professional landscape. Your innovation adventure starts now!`;
}

/**
 * Constructs the HTML email template
 */
function buildEmailTemplate(name: string, industry: string, personalizedMessage: string): string {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 25px; background-color: #fafafa;">
      <header style="text-align: center; margin-bottom: 35px;">
        <h1 style="color: #2c3e50; margin-bottom: 15px; font-size: 28px;">🚀 Innovation Revolution Awaits!</h1>
        <div style="height: 3px; background: linear-gradient(90deg, #3498db, #9b59b6); border-radius: 2px; width: 100px; margin: 0 auto;"></div>
      </header>
      
      <main style="background: linear-gradient(145deg, #4a90e2 0%, #7b68ee 100%); padding: 35px; border-radius: 15px; color: white; margin-bottom: 35px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
        <div style="font-size: 19px; line-height: 1.7; text-align: center;">
          ${personalizedMessage.replace(/\n/g, '<br>')}
        </div>
      </main>
      
      <section style="background: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #3498db; box-shadow: 0 4px 16px rgba(0,0,0,0.05);">
        <h3 style="color: #2c3e50; margin-top: 0; font-size: 22px; margin-bottom: 20px;">🎯 Your Innovation Journey Includes:</h3>
        <div style="color: #555; line-height: 1.8; font-size: 16px;">
          <div style="margin-bottom: 12px;">💡 <strong>Industry-specific insights</strong> for ${industry} transformation</div>
          <div style="margin-bottom: 12px;">🔬 <strong>Priority access</strong> to revolutionary ${industry} innovations</div>
          <div style="margin-bottom: 12px;">🌐 <strong>Network</strong> with top ${industry} innovators and thought leaders</div>
          <div style="margin-bottom: 12px;">⚡ <strong>Accelerate solutions</strong> to ${industry} industry challenges</div>
        </div>
      </section>
      
      <footer style="text-align: center; padding: 25px 0; border-top: 2px solid #ecf0f1;">
        <p style="color: #7f8c8d; margin: 0; font-size: 16px;">
          Ready to transform ${industry}?<br>
          <strong style="color: #2c3e50;">The Innovation Community Leadership</strong>
        </p>
      </footer>
    </div>
  `;
}

/**
 * Processes email sending with personalized content
 */
async function processEmailDelivery(requestData: EmailRequest): Promise<any> {
  const { name, email, industry } = requestData;
  
  console.log(`Processing personalized email for ${name} in ${industry} industry`);

  const customContent = await createPersonalizedWelcomeMessage(name, industry);
  console.log(`Content generated: ${customContent}`);

  const emailTemplate = buildEmailTemplate(name, industry, customContent);

  const deliveryResult = await emailClient.emails.send({
    from: CONFIG.EMAIL_FROM,
    to: [email],
    subject: `🚀 ${name}, Welcome to the Innovation Revolution!`,
    html: emailTemplate,
  });

  console.log("Email delivery completed:", deliveryResult);
  return deliveryResult;
}

/**
 * Main request handler
 */
const requestHandler = async (request: Request): Promise<Response> => {
  // Handle preflight CORS requests
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: HTTP_HEADERS.CORS });
  }

  try {
    const requestBody: EmailRequest = await request.json();
    
    const emailResult = await processEmailDelivery(requestBody);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResult.data?.id,
        status: "delivered"
      }), 
      {
        status: 200,
        headers: { ...HTTP_HEADERS.JSON, ...HTTP_HEADERS.CORS },
      }
    );

  } catch (error: any) {
    console.error("Request processing error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...HTTP_HEADERS.JSON, ...HTTP_HEADERS.CORS },
      }
    );
  }
};

// Start the server
serve(requestHandler);