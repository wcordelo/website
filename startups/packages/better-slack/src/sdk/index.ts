/** COMM-023: TypeScript Agent SDK for Better Slack */
export interface BetterSlackClientOptions {
  baseUrl: string;
  apiKey: string;
}

export interface Thread {
  id: string;
  channel_id: string;
  title: string;
  slug: string;
  status: "open" | "in_progress" | "resolved";
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  author_id: string;
  author_type: string;
  body: string;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
}

export class BetterSlackAgent {
  constructor(private readonly options: BetterSlackClientOptions) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.options.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Agent-Key": this.options.apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  async evaluateCapability(action: string, channelSlug?: string): Promise<boolean> {
    const result = await this.request<{ allowed: boolean }>("POST", "/api/agents/evaluate", {
      action,
      channelSlug,
    });
    return result.allowed;
  }

  async listThreads(channelSlug: string, humanToken: string): Promise<Thread[]> {
    const res = await fetch(`${this.options.baseUrl}/api/threads/channel/${channelSlug}`, {
      headers: { Authorization: `Bearer ${humanToken}` },
    });
    const data = (await res.json()) as { threads: Thread[] };
    return data.threads;
  }

  async getThread(threadId: string, humanToken: string): Promise<Thread> {
    const res = await fetch(`${this.options.baseUrl}/api/threads/${threadId}`, {
      headers: { Authorization: `Bearer ${humanToken}` },
    });
    const data = (await res.json()) as { thread: Thread };
    return data.thread;
  }

  async replyThread(threadId: string, body: string, humanToken: string): Promise<Message> {
    const res = await fetch(`${this.options.baseUrl}/api/messages/thread/${threadId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${humanToken}`,
      },
      body: JSON.stringify({ body }),
    });
    const data = (await res.json()) as { message: Message };
    return data.message;
  }

  connectWebSocket(workspaceId: string, onEvent: (event: unknown) => void): WebSocket {
    const wsUrl = this.options.baseUrl.replace(/^http/, "ws") + `/ws?workspace=${workspaceId}`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (msg) => {
      try {
        onEvent(JSON.parse(msg.data as string));
      } catch {
        onEvent(msg.data);
      }
    };
    return ws;
  }
}

export function createAgent(options: BetterSlackClientOptions): BetterSlackAgent {
  return new BetterSlackAgent(options);
}
