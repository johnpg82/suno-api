import { NextResponse, NextRequest } from "next/server";
import { cookies } from 'next/headers'
import { sunoApi } from "@/lib/SunoApi";
import { corsHeaders } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    console.log('=== GET_LIMIT DEBUG REQUEST ===');
    console.log('Cookies from request:', (await cookies()).toString());

    const api = await sunoApi((await cookies()).toString());
    const debugResult = await api.debugAuth();

    console.log('Debug result:', JSON.stringify(debugResult, null, 2));

    if (!debugResult.success) {
      return new NextResponse(JSON.stringify({
        error: 'Authentication failed',
        debug: debugResult
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // If debug succeeds, try to get credits
    const credits = await api.get_credits();
    return new NextResponse(JSON.stringify({
      success: true,
      credits_left: credits.credits_left,
      period: credits.period,
      monthly_limit: credits.monthly_limit,
      monthly_usage: credits.monthly_usage,
      debug: debugResult
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  } catch (error: any) {
    console.error('Error in get_limit:', error);
    return new NextResponse(JSON.stringify({
      error: 'Internal server error: ' + error.message,
      details: error.response?.data || 'No additional details'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}