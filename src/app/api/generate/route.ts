import { NextResponse, NextRequest } from "next/server";
import { cookies } from 'next/headers'
import { DEFAULT_MODEL, sunoApi } from "@/lib/SunoApi";
import { corsHeaders } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { prompt, make_instrumental, model, wait_audio } = body;

      // Always get song IDs immediately, regardless of wait_audio setting
      const audioInfo = await (await sunoApi((await cookies()).toString())).generate(
        prompt,
        Boolean(make_instrumental),
        model || DEFAULT_MODEL,
        false // Always set to false to return immediately
      );

      // Format response with song IDs and helpful message
      const response = {
        songs: audioInfo.map(song => ({
          id: song.id,
          title: song.title,
          status: song.status,
          created_at: song.created_at,
          model_name: song.model_name,
          type: song.type,
          // Include audio URLs if available
          audio_url: song.audio_url || null,
          video_url: song.video_url || null,
          image_url: song.image_url || null
        })),
        message: wait_audio ?
          "Songs are being generated. Use /api/get with song IDs to check completion status." :
          "Songs submitted for generation."
      };

      return new NextResponse(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error: any) {
      console.error('Error generating audio:', error);
      return new NextResponse(JSON.stringify({
        error: error.response?.data?.detail || error.toString(),
        message: "Song generation request failed. Please try again."
      }), {
        status: error.response?.status || 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  } else {
    return new NextResponse('Method Not Allowed', {
      headers: {
        Allow: 'POST',
        ...corsHeaders
      },
      status: 405
    });
  }
}


export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}