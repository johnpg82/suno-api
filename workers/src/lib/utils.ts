export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
  'Access-Control-Max-Age': '86400',
};

export interface RouteHandler {
  (request: Request, env: any, ctx: ExecutionContext): Promise<Response>;
}
