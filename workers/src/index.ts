import { DEFAULT_MODEL, sunoApi } from './lib/SunoApi';
import { corsHeaders, RouteHandler } from './lib/utils';
import type { BrowserWorker } from '@cloudflare/playwright';

export interface Env {
  MYBROWSER: BrowserWorker;
  SUNO_COOKIE?: string;
  TWOCAPTCHA_KEY?: string;
}

// Route handlers
const generateHandler: RouteHandler = async (request, env) => {
  try {
    const body = await request.json() as any;
    const { prompt, make_instrumental, model, wait_audio } = body;

    const cookieHeader = request.headers.get('Cookie') || undefined;
    const audioInfo = await (await sunoApi(cookieHeader, env)).generate(
      prompt,
      Boolean(make_instrumental),
      model || DEFAULT_MODEL,
      Boolean(wait_audio)
    );

    return new Response(JSON.stringify(audioInfo), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error: any) {
    console.error('Error generating audio:', error);
    if (error.response?.status === 402) {
      return new Response(JSON.stringify({ error: error.response.data.detail }), {
        status: 402,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
    return new Response(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};

const customGenerateHandler: RouteHandler = async (request, env) => {
  try {
    const body = await request.json() as any;
    const { prompt, tags, title, make_instrumental, model, wait_audio, negative_tags } = body;

    const cookieHeader = request.headers.get('Cookie') || undefined;
    const audioInfo = await (await sunoApi(cookieHeader, env)).custom_generate(
      prompt,
      tags,
      title,
      Boolean(make_instrumental),
      model || DEFAULT_MODEL,
      Boolean(wait_audio),
      negative_tags
    );

    return new Response(JSON.stringify(audioInfo), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error: any) {
    console.error('Error generating custom audio:', error);
    return new Response(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};

const generateLyricsHandler: RouteHandler = async (request, env) => {
  try {
    const body = await request.json() as any;
    const { prompt } = body;

    const cookieHeader = request.headers.get('Cookie') || undefined;
    const lyrics = await (await sunoApi(cookieHeader, env)).generateLyrics(prompt);

    return new Response(JSON.stringify({ text: lyrics }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error: any) {
    console.error('Error generating lyrics:', error);
    return new Response(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};

const getHandler: RouteHandler = async (request, env) => {
  try {
    const url = new URL(request.url);
    const ids = url.searchParams.get('ids');
    const page = url.searchParams.get('page');
    
    const cookieHeader = request.headers.get('Cookie') || undefined;
    const audioInfo = await (await sunoApi(cookieHeader, env)).get(
      ids ? ids.split(',') : undefined,
      page
    );

    return new Response(JSON.stringify(audioInfo), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error: any) {
    console.error('Error getting audio info:', error);
    return new Response(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};

const getLimitHandler: RouteHandler = async (request, env) => {
  try {
    const cookieHeader = request.headers.get('Cookie') || undefined;
    const credits = await (await sunoApi(cookieHeader, env)).get_credits();

    return new Response(JSON.stringify(credits), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error: any) {
    console.error('Error getting credits:', error);
    return new Response(JSON.stringify({ error: 'Internal server error: ' + (error.message || 'Unknown error') }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};

// Debug handler to check cookie
const debugHandler: RouteHandler = async (request, env) => {
  const cookieHeader = request.headers.get('Cookie') || 'No Cookie header';
  const hasSunoCookie = !!env.SUNO_COOKIE;
  const cookieLength = env.SUNO_COOKIE ? env.SUNO_COOKIE.length : 0;
  const hasClient = env.SUNO_COOKIE ? env.SUNO_COOKIE.includes('__client') : false;
  const cookiePreview = env.SUNO_COOKIE ? env.SUNO_COOKIE.substring(0, 100) + '...' : 'No cookie';
  const lastChars = env.SUNO_COOKIE ? '...' + env.SUNO_COOKIE.substring(env.SUNO_COOKIE.length - 50) : '';
  
  return new Response(JSON.stringify({
    message: 'Debug info',
    hasSunoCookie,
    cookieLength,
    hasClient,
    cookiePreview,
    lastChars,
    cookieHeader: cookieHeader.substring(0, 50) + '...',
    envKeys: Object.keys(env).filter(k => k !== 'SUNO_COOKIE' && k !== 'TWOCAPTCHA_KEY')
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
};

// Main router
const routes: Record<string, Record<string, RouteHandler>> = {
  '/api/generate': {
    POST: generateHandler,
  },
  '/api/custom_generate': {
    POST: customGenerateHandler,
  },
  '/api/generate_lyrics': {
    POST: generateLyricsHandler,
  },
  '/api/get': {
    GET: getHandler,
  },
  '/api/get_limit': {
    GET: getLimitHandler,
  },
  '/api/debug': {
    GET: debugHandler,
  },
  '/api/test': {
    GET: async (request, env) => {
      return new Response(JSON.stringify({
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        worker: 'suno-api-workers',
        hasPlaywright: !!env.MYBROWSER,
        hasCookie: !!env.SUNO_COOKIE,
        hasApiKey: !!env.TWOCAPTCHA_KEY
      }, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  },
  '/api/test-auth': {
    GET: async (request, env) => {
      try {
        const cookieHeader = request.headers.get('Cookie') || undefined;
        const api = await sunoApi(cookieHeader, env);
        return new Response(JSON.stringify({
          success: true,
          message: 'Authentication successful!'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      } catch (error: any) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          details: error.response?.data || 'No additional details'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }
  }
};

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    // Find matching route
    const route = routes[pathname];
    if (route) {
      const handler = route[request.method];
      if (handler) {
        return handler(request, env, ctx);
      }
    }

    // Default response
    return new Response(JSON.stringify({
      message: 'Suno API on Cloudflare Workers',
      endpoints: Object.keys(routes),
      docs: 'https://github.com/gcui-art/suno-api'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  },
};
