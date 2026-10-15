export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getNow, getDone, getNext, addTask, completeTask } from '@/lib/ops';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * ops-board MCP server. Point an MCP client at /api/mcp.
 * No auth in v1: Jay's personal tool.
 */

const SERVER_INFO = { name: 'ops-board', version: '1.0.0' };
const PROTOCOL_VERSION = '2025-03-26';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const TOOLS = [
  { name: 'ops_list_now', description: 'List what agents are currently working on: active runs and in-flight tasks.', inputSchema: { type: 'object', properties: {} } },
  { name: 'ops_list_done', description: 'List completed work: finished runs and the done log.', inputSchema: { type: 'object', properties: {} } },
  { name: 'ops_list_next', description: 'List what is up next: task notes and queued runs.', inputSchema: { type: 'object', properties: {} } },
  { name: 'ops_add_task', description: 'Add a task for Jay or the agents. Shows in the Next queue and shared notes.', inputSchema: { type: 'object', properties: { note: { type: 'string', description: 'The task text' }, author: { type: 'string', description: 'Who assigned it' } }, required: ['note'] } },
  { name: 'ops_complete_task', description: 'Mark a task note done. Moves it to the done log.', inputSchema: { type: 'object', properties: { noteId: { type: 'string', description: 'The note id from ops_list_next' } }, required: ['noteId'] } },
];

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS });
}

function ok(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: '2.0', id, result }, { headers: CORS });
}
function err(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: '2.0', id: id ?? null, error: { code, message } }, { headers: CORS });
}

async function callTool(name: string, args: any) {
  switch (name) {
    case 'ops_list_now':
      return await getNow();
    case 'ops_list_done':
      return await getDone();
    case 'ops_list_next':
      return await getNext();
    case 'ops_add_task': {
      if (!args?.note) throw new Error('note is required');
      return { task: await addTask(String(args.note), String(args.author || 'agent')) };
    }
    case 'ops_complete_task': {
      if (!args?.noteId) throw new Error('noteId is required');
      return await completeTask(String(args.noteId));
    }
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return err(null, -32700, 'Parse error');
  const { id, method, params } = body as { id?: unknown; method?: string; params?: any };

  switch (method) {
    case 'initialize':
      return ok(id, { protocolVersion: PROTOCOL_VERSION, capabilities: { tools: {} }, serverInfo: SERVER_INFO });
    case 'notifications/initialized':
      return ok(id, {});
    case 'tools/list':
      return ok(id, { tools: TOOLS });
    case 'tools/call': {
      const name = params?.name as string;
      try {
        const result = await callTool(name, params?.arguments || {});
        return ok(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
      } catch (e: any) {
        return err(id, -32603, e?.message || 'tool failed');
      }
    }
    default:
      return err(id, -32601, `method not found: ${method}`);
  }
}
