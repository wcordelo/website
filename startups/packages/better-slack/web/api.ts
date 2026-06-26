const API = "/api";

export function getToken(): string | null {
  return localStorage.getItem("bs_token");
}

export function setToken(token: string): void {
  localStorage.setItem("bs_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("bs_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface User {
  id: string;
  workspace_id: string;
  email: string;
  name: string;
}

export interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Thread {
  id: string;
  channel_id: string;
  parent_thread_id?: string | null;
  title: string;
  slug: string;
  status: "open" | "in_progress" | "resolved";
  summary: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface ThreadPreview {
  id: string;
  title: string;
  status: string;
  channel_slug?: string;
  summary?: string | null;
  message_count?: number;
  found?: boolean;
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
  template: string | null;
  created_by_type?: string;
}

export interface PostVersion {
  id: string;
  post_id: string;
  version: number;
  content: string;
  change_summary: string;
  created_at: string;
}

export interface PostTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
}

export interface SearchResult {
  entityType: string;
  entityId: string;
  title: string;
  snippet: string;
  score: number;
}

export const api = {
  login: (email: string) => request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ email }) }),
  signup: (email: string, name: string) =>
    request<{ token: string; user: User }>("/auth/signup", { method: "POST", body: JSON.stringify({ email, name }) }),
  me: () => request<{ user: User }>("/auth/me"),
  channels: () => request<{ channels: Channel[] }>("/channels"),
  threads: (channelSlug: string) => request<{ threads: Thread[] }>(`/threads/channel/${channelSlug}`),
  thread: (id: string) => request<{ thread: Thread }>(`/threads/${id}`),
  threadPreview: (id: string) => request<{ preview: ThreadPreview }>(`/threads/${id}/preview`),
  threadPreviews: (threadIds: string[]) =>
    request<{ previews: ThreadPreview[] }>("/threads/previews", {
      method: "POST",
      body: JSON.stringify({ threadIds }),
    }),
  subthreads: (threadId: string) => request<{ subthreads: Thread[] }>(`/threads/${threadId}/subthreads`),
  createThread: (channelSlug: string, title: string, body?: string, parentThreadId?: string) =>
    request<{ thread: Thread }>(`/threads/channel/${channelSlug}`, {
      method: "POST",
      body: JSON.stringify({ title, body, parentThreadId }),
    }),
  splitThread: (threadId: string, title: string, fromMessageId?: string) =>
    request<{ thread: Thread }>(`/threads/${threadId}/split`, {
      method: "POST",
      body: JSON.stringify({ title, fromMessageId }),
    }),
  updateThreadStatus: (threadId: string, status: string, summary?: string) =>
    request<{ thread: Thread }>(`/threads/${threadId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, summary }),
    }),
  getSubscription: (threadId: string) => request<{ subscribed: boolean }>(`/threads/${threadId}/subscribe`),
  subscribe: (threadId: string) =>
    request<{ subscribed: boolean }>(`/threads/${threadId}/subscribe`, { method: "POST" }),
  unsubscribe: (threadId: string) =>
    request<{ subscribed: boolean }>(`/threads/${threadId}/subscribe`, { method: "DELETE" }),
  messages: (threadId: string) => request<{ messages: Message[] }>(`/messages/thread/${threadId}`),
  createMessage: (threadId: string, body: string) =>
    request<{ message: Message }>(`/messages/thread/${threadId}`, { method: "POST", body: JSON.stringify({ body }) }),
  search: (q: string) => request<{ results: SearchResult[] }>(`/search?q=${encodeURIComponent(q)}`),
  posts: (status?: string) => request<{ posts: Post[] }>(status ? `/posts?status=${status}` : "/posts"),
  postTemplates: () => request<{ templates: PostTemplate[] }>("/posts/templates"),
  postTemplate: (id: string) => request<{ template: PostTemplate }>(`/posts/templates/${id}`),
  post: (id: string) => request<{ post: Post; versions: PostVersion[]; latestVersion: PostVersion }>(`/posts/${id}`),
  postDiff: (id: string, from: number, to: number) =>
    request<{ diff: { added: string[]; removed: string[] }; fromContent: string; toContent: string }>(
      `/posts/${id}/diff?from=${from}&to=${to}`,
    ),
  createPost: (data: { title: string; content: string; template?: string }) =>
    request<{ post: Post }>("/posts", { method: "POST", body: JSON.stringify(data) }),
  approvePost: (postId: string) => request<{ post: Post }>(`/posts/${postId}/approve`, { method: "POST" }),
  rejectPost: (postId: string, reason?: string) =>
    request<{ post: Post }>(`/posts/${postId}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),
  newPostVersion: (postId: string, content: string, changeSummary?: string) =>
    request<{ version: PostVersion }>(`/posts/${postId}/versions`, {
      method: "POST",
      body: JSON.stringify({ content, changeSummary }),
    }),
  billingTier: () => request<{ tier: string; limits: Record<string, unknown> }>("/billing/tier"),
};

/** COMM-007: Parse >>thread:id references */
export function parseThreadRefs(text: string): { threadId: string; match: string }[] {
  const pattern = />>(?:thread:)?([a-f0-9-]{36})/gi;
  const refs: { threadId: string; match: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text)) !== null) {
    refs.push({ threadId: m[1]!, match: m[0] });
  }
  return refs;
}
