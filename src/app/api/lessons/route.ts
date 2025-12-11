import { masterPrompt } from '@/constants/prompts';
import { getServerAuthSession } from '@/lib/auth';
import { env } from '@/lib/env';

type LessonMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const jsonHeaders = {
  'Content-Type': 'application/json',
};

export async function POST(req: Request) {
  const session = await getServerAuthSession();

  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  try {
    const { messages = [] }: { messages?: LessonMessage[] } = await req.json();

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided.' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const anthropicApiKey = env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API key is not configured.' }),
        {
          status: 500,
          headers: jsonHeaders,
        },
      );
    }

    const payload = {
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      temperature: 0.3,
      system: masterPrompt,
      messages: messages.map((message) => ({
        role: message.role,
        content: [
          {
            type: 'text' as const,
            text: message.content,
          },
        ],
      })),
    };

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        ...jsonHeaders,
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    if (!anthropicResponse.ok) {
      const errorResponse = await anthropicResponse.text();
      console.error('[ANTHROPIC_ERROR]', errorResponse);
      return new Response(
        JSON.stringify({ error: 'Failed to generate lesson plan.' }),
        {
          status: anthropicResponse.status,
          headers: jsonHeaders,
        },
      );
    }

    const anthropicData: {
      content?: { type: string; text?: string }[];
    } = await anthropicResponse.json();

    const assistantText = (anthropicData.content ?? [])
      .filter((item) => item.type === 'text' && item.text)
      .map((item) => item.text ?? '')
      .join('\n');

    return new Response(JSON.stringify({ message: assistantText }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (error) {
    console.error('[API_ERROR]', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
}
