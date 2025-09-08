import axios, { AxiosInstance } from 'axios';
import * as cookie from 'cookie';
import { launch, type BrowserWorker } from '@cloudflare/playwright';

export const DEFAULT_MODEL = 'chirp-v3-5';

export interface AudioInfo {
  id: string;
  title?: string;
  image_url?: string;
  lyric?: string;
  audio_url?: string;
  video_url?: string;
  created_at: string;
  model_name: string;
  gpt_description_prompt?: string;
  prompt?: string;
  status: string;
  type?: string;
  tags?: string;
  negative_tags?: string;
  duration?: string;
  error_message?: string;
}

interface Env {
  MYBROWSER: BrowserWorker;
  SUNO_COOKIE?: string;
  TWOCAPTCHA_KEY?: string;
}

class SunoApi {
  private static BASE_URL: string = 'https://studio-api.prod.suno.com';
  private static CLERK_BASE_URL: string = 'https://clerk.suno.com';
  private static CLERK_VERSION = '5.15.0';

  private readonly client: AxiosInstance;
  private sid?: string;
  private currentToken?: string;
  private deviceId?: string;
  private userAgent?: string;
  private cookies: Record<string, string | undefined>;
  private env: Env;

  constructor(cookies: string, env: Env) {
    this.env = env;
    // Use a fixed macOS user agent for Cloudflare Workers compatibility
    this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.cookies = cookie.parse(cookies);
    this.deviceId = this.cookies.ajs_anonymous_id || crypto.randomUUID();
    this.client = axios.create({
      withCredentials: true,
      headers: {
        'Affiliate-Id': 'undefined',
        'Device-Id': `"${this.deviceId}"`,
        'x-suno-client': 'Android prerelease-4nt180t 1.0.42',
        'X-Requested-With': 'com.suno.android',
        'sec-ch-ua': '"Chromium";v="130", "Android WebView";v="130", "Not?A_Brand";v="99"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'User-Agent': this.userAgent
      }
    });
    this.client.interceptors.request.use(config => {
      if (this.currentToken && !config.headers.Authorization)
        config.headers.Authorization = `Bearer ${this.currentToken}`;
      const cookiesArray = Object.entries(this.cookies).map(([key, value]) => 
        cookie.serialize(key, value as string)
      );
      config.headers.Cookie = cookiesArray.join('; ');
      return config;
    });
    this.client.interceptors.response.use(resp => {
      const setCookieHeader = resp.headers['set-cookie'];
      if (Array.isArray(setCookieHeader)) {
        const newCookies = cookie.parse(setCookieHeader.join('; '));
        for (const [key, value] of Object.entries(newCookies)) {
          this.cookies[key] = value;
        }
      }
      return resp;
    })
  }

  public async init(): Promise<SunoApi> {
    await this.getAuthToken();
    await this.keepAlive();
    return this;
  }

  private async getAuthToken() {
    console.log('Getting the session ID');
    const getSessionUrl = `${SunoApi.CLERK_BASE_URL}/v1/client?_is_native=true&_clerk_js_version=${SunoApi.CLERK_VERSION}`;
    try {
      const sessionResponse = await this.client.get(getSessionUrl, {
        headers: { Authorization: this.cookies.__client }
      });
      console.log('Session response status:', sessionResponse.status);
      console.log('Session response data:', JSON.stringify(sessionResponse.data).substring(0, 200));
      
      if (!sessionResponse?.data?.response?.last_active_session_id) {
        console.error('Session response missing last_active_session_id:', sessionResponse.data);
        throw new Error(
          'Failed to get session id, you may need to update the SUNO_COOKIE'
        );
      }
      this.sid = sessionResponse.data.response.last_active_session_id;
    } catch (error: any) {
      console.error('Error getting auth token:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data).substring(0, 200));
      }
      throw error;
    }
  }

  public async keepAlive(isWait?: boolean): Promise<void> {
    if (!this.sid) {
      throw new Error('Session ID is not set. Cannot renew token.');
    }
    const renewUrl = `${SunoApi.CLERK_BASE_URL}/v1/client/sessions/${this.sid}/tokens?_is_native=true&_clerk_js_version=${SunoApi.CLERK_VERSION}`;
    console.log('KeepAlive...\n');
    const renewResponse = await this.client.post(renewUrl, {}, {
      headers: { Authorization: this.cookies.__client }
    });
    if (isWait) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    const newToken = renewResponse.data.jwt;
    this.currentToken = newToken;
  }

  private async captchaRequired(): Promise<boolean> {
    const resp = await this.client.post(`${SunoApi.BASE_URL}/api/c/check`, {
      ctype: 'generation'
    });
    console.log(resp.data);
    return resp.data.required;
  }

  public async getCaptcha(): Promise<string|null> {
    if (!await this.captchaRequired())
      return null;

    if (!this.env.TWOCAPTCHA_KEY) {
      throw new Error('CAPTCHA required but TWOCAPTCHA_KEY not set');
    }

    console.log('CAPTCHA required. Launching browser...')
    const browser = await launch(this.env.MYBROWSER, { keep_alive: 600000 });
    const page = await browser.newPage();
    
    try {
      await page.goto('https://suno.com/create', { 
        referer: 'https://www.google.com/', 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
      });

      console.log('Waiting for Suno interface to load');
      await page.waitForResponse('**/api/project/**\\?**', { timeout: 60000 });

      // Try to close popups
      try {
        await page.getByLabel('Close').click({ timeout: 2000 });
      } catch(e) {}

      const textarea = page.locator('.custom-textarea');
      await textarea.click();
      await textarea.pressSequentially('Lorem ipsum', { delay: 80 });

      const button = page.locator('button[aria-label="Create"]').locator('div.flex');
      await button.click();

      // Wait for hCaptcha to appear and solve it
      const token = await this.solveHcaptcha(page);
      
      await browser.close();
      return token;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  private async solveHcaptcha(page: any): Promise<string> {
    // Simplified CAPTCHA solving - in production, you'd integrate with 2Captcha API
    // For now, we'll return a placeholder
    console.log('CAPTCHA solving not fully implemented in Workers version yet');
    return null;
  }

  public async generate(
    prompt: string,
    make_instrumental: boolean = false,
    model?: string,
    wait_audio: boolean = false
  ): Promise<AudioInfo[]> {
    await this.keepAlive(false);
    const startTime = Date.now();
    const audios = await this.generateSongs(
      prompt,
      false,
      undefined,
      undefined,
      make_instrumental,
      model,
      wait_audio
    );
    const costTime = Date.now() - startTime;
    console.log('Generate Response:\n' + JSON.stringify(audios, null, 2));
    console.log('Cost time: ' + costTime);
    return audios;
  }

  public async custom_generate(
    prompt: string,
    tags: string,
    title: string,
    make_instrumental: boolean = false,
    model?: string,
    wait_audio: boolean = false,
    negative_tags?: string,
    duration?: string
  ): Promise<AudioInfo[]> {
    const startTime = Date.now();
    const audios = await this.generateSongs(
      prompt,
      true,
      tags,
      title,
      make_instrumental,
      model,
      wait_audio,
      negative_tags,
      undefined,
      undefined,
      undefined,
      duration
    );
    const costTime = Date.now() - startTime;
    console.log(
      'Custom Generate Response:\n' + JSON.stringify(audios, null, 2)
    );
    console.log('Cost time: ' + costTime);
    return audios;
  }

  private async generateSongs(
    prompt: string,
    isCustom: boolean,
    tags?: string,
    title?: string,
    make_instrumental?: boolean,
    model?: string,
    wait_audio: boolean = false,
    negative_tags?: string,
    task?: string,
    continue_clip_id?: string,
    continue_at?: number,
    duration?: string
  ): Promise<AudioInfo[]> {
    await this.keepAlive();
    const payload: any = {
      make_instrumental: make_instrumental,
      mv: model || DEFAULT_MODEL,
      prompt: '',
      generation_type: 'TEXT',
      continue_at: continue_at,
      continue_clip_id: continue_clip_id,
      task: task,
      token: await this.getCaptcha()
    };

    // Add duration if specified
    if (duration) {
      payload.duration = duration;
    }
    if (isCustom) {
      payload.tags = tags;
      payload.title = title;
      payload.negative_tags = negative_tags;
      payload.prompt = prompt;
    } else {
      payload.gpt_description_prompt = prompt;
    }
    console.log(
      'generateSongs payload:\n' +
        JSON.stringify(
          {
            prompt: prompt,
            isCustom: isCustom,
            tags: tags,
            title: title,
            make_instrumental: make_instrumental,
            wait_audio: wait_audio,
            negative_tags: negative_tags,
            payload: payload
          },
          null,
          2
        )
    );
    const response = await this.client.post(
      `${SunoApi.BASE_URL}/api/generate/v2/`,
      payload,
      {
        timeout: 10000
      }
    );
    if (response.status !== 200) {
      throw new Error('Error response:' + response.statusText);
    }
    const songIds = response.data.clips.map((audio: any) => audio.id);
    
    if (wait_audio) {
      const startTime = Date.now();
      let lastResponse: AudioInfo[] = [];
      await new Promise(resolve => setTimeout(resolve, 5000));
      while (Date.now() - startTime < 100000) {
        const response = await this.get(songIds);
        const allCompleted = response.every(
          (audio) => audio.status === 'streaming' || audio.status === 'complete'
        );
        const allError = response.every((audio) => audio.status === 'error');
        if (allCompleted || allError) {
          return response;
        }
        lastResponse = response;
        await new Promise(resolve => setTimeout(resolve, 4000));
        await this.keepAlive(true);
      }
      return lastResponse;
    } else {
      return response.data.clips.map((audio: any) => ({
        id: audio.id,
        title: audio.title,
        image_url: audio.image_url,
        lyric: audio.metadata.prompt,
        audio_url: audio.audio_url,
        video_url: audio.video_url,
        created_at: audio.created_at,
        model_name: audio.model_name,
        status: audio.status,
        gpt_description_prompt: audio.metadata.gpt_description_prompt,
        prompt: audio.metadata.prompt,
        type: audio.metadata.type,
        tags: audio.metadata.tags,
        negative_tags: audio.metadata.negative_tags,
        duration: audio.metadata.duration
      }));
    }
  }

  public async generateLyrics(prompt: string): Promise<string> {
    await this.keepAlive(false);
    const generateResponse = await this.client.post(
      `${SunoApi.BASE_URL}/api/generate/lyrics/`,
      { prompt }
    );
    const generateId = generateResponse.data.id;

    let lyricsResponse = await this.client.get(
      `${SunoApi.BASE_URL}/api/generate/lyrics/${generateId}`
    );
    while (lyricsResponse?.data?.status !== 'complete') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      lyricsResponse = await this.client.get(
        `${SunoApi.BASE_URL}/api/generate/lyrics/${generateId}`
      );
    }

    return lyricsResponse.data;
  }

  public async get(
    songIds?: string[],
    page?: string | null
  ): Promise<AudioInfo[]> {
    await this.keepAlive(false);
    let url = new URL(`${SunoApi.BASE_URL}/api/feed/v2`);
    if (songIds) {
      url.searchParams.append('ids', songIds.join(','));
    }
    if (page) {
      url.searchParams.append('page', page);
    }
    console.log('Get audio status: ' + url.href);
    const response = await this.client.get(url.href, {
      timeout: 10000
    });

    const audios = response.data.clips;

    return audios.map((audio: any) => ({
      id: audio.id,
      title: audio.title,
      image_url: audio.image_url,
      lyric: audio.metadata.prompt || '',
      audio_url: audio.audio_url,
      video_url: audio.video_url,
      created_at: audio.created_at,
      model_name: audio.model_name,
      status: audio.status,
      gpt_description_prompt: audio.metadata.gpt_description_prompt,
      prompt: audio.metadata.prompt,
      type: audio.metadata.type,
      tags: audio.metadata.tags,
      duration: audio.metadata.duration,
      error_message: audio.metadata.error_message
    }));
  }

  public async get_credits(): Promise<object> {
    await this.keepAlive(false);
    const response = await this.client.get(
      `${SunoApi.BASE_URL}/api/billing/info/`
    );
    return {
      credits_left: response.data.total_credits_left,
      period: response.data.period,
      monthly_limit: response.data.monthly_limit,
      monthly_usage: response.data.monthly_usage
    };
  }
}

// Singleton cache for Workers
const sunoApiCache = new Map<string, SunoApi>();

export const sunoApi = async (cookie: string | undefined, env: Env) => {
  const resolvedCookie = cookie && cookie.includes('__client') ? cookie : env.SUNO_COOKIE;
  if (!resolvedCookie) {
    console.log('No cookie provided! Aborting...\nPlease provide a cookie either in the environment or in the Cookie header of your request.')
    throw new Error('Please provide a cookie either in the environment or in the Cookie header of your request.');
  }

  const cachedInstance = sunoApiCache.get(resolvedCookie);
  if (cachedInstance)
    return cachedInstance;

  const instance = await new SunoApi(resolvedCookie, env).init();
  sunoApiCache.set(resolvedCookie, instance);

  return instance;
};
