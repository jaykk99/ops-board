export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { getNow, getDone, getNext, addTask, completeTask, logDone } from '@/lib/ops';
import { isValidNote } from '@/lib/format';

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
  { name: 'ops_add_task', description: 'Add a task for Jay or the agents. Shows in the Next queue and shared notes.', inputSchema: { type: 'object', properties: { note: { type: 'string', description: 'The task text' }, author: { type: 'string', description: 'Who assigned it' }, priority: { type: 'integer', description: '1 low, 2 normal, 3 high', minimum: 1, maximum: 3 } }, required: ['note'] } },
  { name: 'ops_complete_task', description: 'Mark a task note done. Moves it to the done log.', inputSchema: { type: 'object', properties: { noteId: { type: 'string', description: 'The note id from ops_list_next' } }, required: ['noteId'] } },
  { name: 'ops_log_done', description: 'Add an entry straight to the done log without touching the task queue.', inputSchema: { type: 'object', properties: { title: { type: 'string', description: 'What got finished' }, detail: { type: 'string', description: 'Optional extra detail' } }, required: ['title'] } },
  { name: 'ops_summary', description: 'One compact snapshot: counts of active runs, in-flight tasks, queued tasks and recent done entries.', inputSchema: { type: 'object', properties: {} } },
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
      return { task: await addTask(String(args.note), String(args.author || 'agent'), args.priority) };
    }
    case 'ops_complete_task': {
      if (!args?.noteId) throw new Error('noteId is required');
      return await completeTask(String(args.noteId));
    }
    case 'ops_log_done': {
      if (!isValidNote(args?.title)) throw new Error('title is required');
      return { entry: await logDone(String(args.title), String(args.detail || '')) };
    }
    case 'ops_summary': {
      const [now, done, next] = await Promise.all([getNow(), getDone(), getNext()]);
      return {
        active_runs: now.runs.length,
        inflight_tasks: now.tasks.length,
        queued_tasks: next.notes.length,
        queued_runs: next.queued.length,
        done_log_recent: done.log.length,
        done_runs: done.runs.length,
      };
    }
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

export async function GET() {
  return NextResponse.json(
    { ...SERVER_INFO, protocolVersion: PROTOCOL_VERSION, tools: TOOLS.map((t) => t.name) },
    { headers: CORS }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return err(null, -32700, 'Parse error');
  const { id, method, params } = body as { id?: unknown; method?: string; params?: any };

  switch (method) {
    case 'ping':
      return ok(id, {});
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
