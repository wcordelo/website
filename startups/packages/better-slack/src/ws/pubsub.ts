/** COMM-012: Real-time WebSocket pubsub */

export type WsEvent =
  | { type: "thread.created"; thread: unknown }
  | { type: "thread.updated"; thread: unknown }
  | { type: "message.created"; message: unknown; threadId: string }
  | { type: "post.created"; post: unknown; version: unknown }
  | { type: "post.version"; postId: string; version: unknown }
  | { type: "agent.action"; action: string; details: unknown };

type Subscriber = {
  workspaceId: string;
  send: (data: string) => void;
};

class PubSub {
  private subscribers = new Set<Subscriber>();

  subscribe(workspaceId: string, send: (data: string) => void): () => void {
    const sub: Subscriber = { workspaceId, send };
    this.subscribers.add(sub);
    return () => this.subscribers.delete(sub);
  }

  publish(workspaceId: string, event: WsEvent): void {
    const payload = JSON.stringify({ ...event, timestamp: new Date().toISOString() });
    for (const sub of this.subscribers) {
      if (sub.workspaceId === workspaceId) {
        try {
          sub.send(payload);
        } catch {
          this.subscribers.delete(sub);
        }
      }
    }
  }
}

export const pubsub = new PubSub();
