import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useParams, useNavigate } from "react-router-dom";
import {
  api,
  getToken,
  clearToken,
  parseThreadRefs,
  type User,
  type Channel,
  type Thread,
  type Message,
  type Post,
  type PostVersion,
  type ThreadPreview,
  type SearchResult,
} from "./api";

function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api.me()
      .then((r) => setUser(r.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  return { user, setUser, loading };
}

function LoginPage({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState("demo@better-slack.dev");
  const [name, setName] = useState("Demo User");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const { token, user } = await api.login(email);
      localStorage.setItem("bs_token", token);
      onLogin(user);
    } catch {
      try {
        const { token, user } = await api.signup(email, name);
        localStorage.setItem("bs_token", token);
        onLogin(user);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Better Slack</h1>
        <p>Forum-first team communication. Threads, not firehoses.</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div className="form-group">
            <label>Name (signup)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {error && <p style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.85rem" }}>{error}</p>}
          <button type="submit" style={{ width: "100%" }}>
            Continue
          </button>
        </form>
        <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--muted)" }}>
          Enterprise? <a href="/api/auth/saml/login?org=demo">Sign in with SSO</a>
        </p>
      </div>
    </div>
  );
}

function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.search(query).then((r) => {
        setResults(r.results);
        setOpen(true);
      });
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="search-bar">
      <input
        placeholder="Search threads, messages, posts…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="search-results">
          {results.map((r) => (
            <Link
              key={`${r.entityType}-${r.entityId}`}
              to={r.entityType === "post" ? `/posts/${r.entityId}` : `/thread/${r.entityId}`}
              onClick={() => setOpen(false)}
            >
              <span className="search-type">{r.entityType}</span>
              <strong>{r.title}</strong>
              <span className="search-snippet" dangerouslySetInnerHTML={{ __html: r.snippet }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Layout({ user, children }: { user: User; children: React.ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    api.channels().then((r) => setChannels(r.channels));
  }, []);

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>Better Slack</h1>
        <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{user.name}</p>
        <SearchBar />
        <nav>
          {channels.map((ch) => (
            <Link key={ch.id} to={`/channel/${ch.slug}`}>
              #{ch.slug}
            </Link>
          ))}
          <Link to="/posts">Posts</Link>
          <Link to="/posts/new">New Post</Link>
          <Link to="/posts/proposals">Proposals</Link>
        </nav>
        <button
          className="secondary"
          style={{ marginTop: "auto" }}
          onClick={() => {
            clearToken();
            window.location.href = "/";
          }}
        >
          Sign out
        </button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

/** COMM-003: Thread composer with title + body */
function ChannelPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    api.threads(slug).then((r) => setThreads(r.threads)).finally(() => setLoading(false));
  }, [slug]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!slug || !title.trim()) return;
    setCreating(true);
    setError("");
    try {
      const { thread } = await api.createThread(slug, title.trim(), body.trim() || undefined);
      setThreads((prev) => [thread, ...prev]);
      setTitle("");
      setBody("");
      navigate(`/thread/${thread.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create thread");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>#{slug}</h2>
        <p>Forum-first channel — threads sorted by activity</p>
      </div>

      <form onSubmit={handleCreate} className="composer thread-composer">
        <input placeholder="Thread title…" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea
          placeholder="Opening message (optional)…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" disabled={creating} style={{ alignSelf: "flex-start" }}>
          {creating ? "Creating…" : "Create thread"}
        </button>
      </form>

      {loading ? (
        <p className="empty">Loading…</p>
      ) : threads.length === 0 ? (
        <p className="empty">No threads yet. Start the first discussion.</p>
      ) : (
        <div className="thread-list">
          {threads.map((t) => (
            <Link key={t.id} to={`/thread/${t.id}`} className="thread-card">
              <h3>{t.title}</h3>
              <div className="thread-meta">
                <span className={`status ${t.status}`}>{t.status.replace("_", " ")}</span>
                <span>{t.message_count ?? 0} messages</span>
                <span>{new Date(t.updated_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

/** COMM-007: Message body with cross-thread reference previews */
function MessageBody({ body }: { body: string }) {
  const refs = parseThreadRefs(body);
  const [previews, setPreviews] = useState<Record<string, ThreadPreview>>({});

  useEffect(() => {
    if (refs.length === 0) return;
    api.threadPreviews(refs.map((r) => r.threadId)).then((r) => {
      const map: Record<string, ThreadPreview> = {};
      for (const p of r.previews) {
        if (p.found !== false) map[p.id] = p;
      }
      setPreviews(map);
    });
  }, [body]);

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const pattern = />>(?:thread:)?([a-f0-9-]{36})/gi;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(body)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{body.slice(lastIndex, match.index)}</span>);
    }
    const threadId = match[1]!;
    const preview = previews[threadId];
    parts.push(
      <span key={key++} className="thread-ref">
        {preview ? (
          <Link to={`/thread/${threadId}`} className="thread-ref-card">
            <span className="thread-ref-label">#{preview.channel_slug}</span>
            <strong>{preview.title}</strong>
            <span className={`status ${preview.status}`}>{preview.status?.replace("_", " ")}</span>
          </Link>
        ) : (
          <code>{match[0]}</code>
        )}
      </span>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < body.length) {
    parts.push(<span key={key++}>{body.slice(lastIndex)}</span>);
  }

  return (
    <div className="message-body">
      {refs.length > 0 ? parts : <pre>{body}</pre>}
    </div>
  );
}

/** COMM-030: Resolution summary modal */
function ResolveModal({
  open,
  onClose,
  onResolve,
}: {
  open: boolean;
  onClose: () => void;
  onResolve: (summary: string) => void;
}) {
  const [summary, setSummary] = useState("");

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Resolve thread</h3>
        <p>Capture the decision or outcome before closing this thread.</p>
        <textarea
          placeholder="Resolution summary (required)…"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
          autoFocus
        />
        <div className="modal-actions">
          <button className="secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!summary.trim()}
            onClick={() => {
              onResolve(summary.trim());
              setSummary("");
            }}
          >
            Resolve thread
          </button>
        </div>
      </div>
    </div>
  );
}

/** COMM-004, COMM-005, COMM-006, COMM-030: Thread view */
function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [subthreads, setSubthreads] = useState<Thread[]>([]);
  const [reply, setReply] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [splitTitle, setSplitTitle] = useState("");
  const [showSplit, setShowSplit] = useState(false);
  const [splitFromMsg, setSplitFromMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.thread(id).then((r) => setThread(r.thread));
    api.messages(id).then((r) => setMessages(r.messages));
    api.subthreads(id).then((r) => setSubthreads(r.subthreads));
    api.getSubscription(id).then((r) => setSubscribed(r.subscribed));
  }, [id]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !reply.trim()) return;
    const { message } = await api.createMessage(id, reply);
    setMessages((prev) => [...prev, message]);
    setReply("");
  }

  async function changeStatus(status: Thread["status"], summary?: string) {
    if (!id) return;
    const { thread: updated } = await api.updateThreadStatus(id, status, summary);
    setThread(updated);
    setShowResolve(false);
  }

  async function toggleSubscribe() {
    if (!id) return;
    if (subscribed) {
      await api.unsubscribe(id);
      setSubscribed(false);
    } else {
      await api.subscribe(id);
      setSubscribed(true);
    }
  }

  async function handleSplit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !splitTitle.trim()) return;
    const { thread: sub } = await api.splitThread(id, splitTitle.trim(), splitFromMsg ?? undefined);
    setSubthreads((prev) => [...prev, sub]);
    setSplitTitle("");
    setShowSplit(false);
    setSplitFromMsg(null);
    navigate(`/thread/${sub.id}`);
  }

  if (!thread) return <p className="empty">Loading…</p>;

  return (
    <>
      <div className="page-header">
        <h2>{thread.title}</h2>
        <div className="status-bar">
          <span className={`status ${thread.status}`}>{thread.status.replace("_", " ")}</span>
          <button className={`secondary ${subscribed ? "active" : ""}`} onClick={toggleSubscribe}>
            {subscribed ? "Unsubscribe" : "Subscribe"}
          </button>
          <button className="secondary" onClick={() => changeStatus("open")}>
            Open
          </button>
          <button className="secondary" onClick={() => changeStatus("in_progress")}>
            In Progress
          </button>
          <button className="secondary" onClick={() => setShowResolve(true)}>
            Resolve
          </button>
          <button className="secondary" onClick={() => setShowSplit(true)}>
            Split discussion
          </button>
        </div>
        {thread.summary && (
          <div className="resolution-box">
            <strong>Decision</strong>
            <p>{thread.summary}</p>
          </div>
        )}
      </div>

      {subthreads.length > 0 && (
        <div className="subthreads">
          <h4>Sub-threads</h4>
          {subthreads.map((st) => (
            <Link key={st.id} to={`/thread/${st.id}`} className="thread-card subthread-card">
              <h3>{st.title}</h3>
              <span className={`status ${st.status}`}>{st.status.replace("_", " ")}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className="message">
            <div className="message-meta">
              {m.author_type} · {new Date(m.created_at).toLocaleString()}
              <button className="link-btn" onClick={() => { setSplitFromMsg(m.id); setShowSplit(true); }}>
                Split from here
              </button>
            </div>
            <MessageBody body={m.body} />
          </div>
        ))}
      </div>

      <form onSubmit={sendReply} className="composer">
        <textarea
          placeholder="Reply to thread… Use >>thread:&lt;id&gt; to reference another thread"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
        <button type="submit" style={{ alignSelf: "flex-start" }}>
          Reply
        </button>
      </form>

      <ResolveModal
        open={showResolve}
        onClose={() => setShowResolve(false)}
        onResolve={(summary) => changeStatus("resolved", summary)}
      />

      {showSplit && (
        <div className="modal-overlay" onClick={() => setShowSplit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Split into sub-thread</h3>
            <p>Spin off a focused side discussion without losing the parent context.</p>
            <form onSubmit={handleSplit}>
              <input
                placeholder="Sub-thread title…"
                value={splitTitle}
                onChange={(e) => setSplitTitle(e.target.value)}
                required
              />
              <div className="modal-actions">
                <button className="secondary" type="button" onClick={() => setShowSplit(false)}>
                  Cancel
                </button>
                <button type="submit">Create sub-thread</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/** COMM-009, COMM-010, COMM-011: Post editor */
function PostEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [template, setTemplate] = useState("");
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [versions, setVersions] = useState<PostVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [diff, setDiff] = useState<{ added: string[]; removed: string[] } | null>(null);

  useEffect(() => {
    api.postTemplates().then((r) => setTemplates(r.templates));
  }, []);

  useEffect(() => {
    if (isNew) {
      setContent("# New Post\n\nWrite your durable document here.");
      return;
    }
    api.post(id!).then((r) => {
      setTitle(r.post.title);
      setVersions(r.versions);
      setSelectedVersion(r.latestVersion.version);
      setContent(r.latestVersion.content);
    });
  }, [id, isNew]);

  useEffect(() => {
    if (!template || !isNew) return;
    api.postTemplate(template).then((r) => {
      setContent(r.template.content.replace("[Title]", title || "[Title]"));
    });
  }, [template, isNew]);

  useEffect(() => {
    if (!id || isNew || versions.length < 2 || selectedVersion === null) return;
    const prev = selectedVersion - 1;
    if (prev < 1) return;
    api.postDiff(id, prev, selectedVersion).then((r) => setDiff(r.diff));
  }, [id, isNew, versions, selectedVersion]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (isNew) {
      await api.createPost({ title, content, template: template || undefined });
      window.location.href = "/posts";
    } else {
      await api.newPostVersion(id!, content, "Updated via editor");
      const r = await api.post(id!);
      setVersions(r.versions);
      setSelectedVersion(r.latestVersion.version);
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>{isNew ? "New Post" : "Edit Post"}</h2>
        <p>Durable, versioned documents — not chat messages</p>
      </div>

      <form onSubmit={handleSave} className="post-editor">
        <div className="form-group">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required disabled={!isNew} />
        </div>
        {isNew && (
          <div className="form-group">
            <label>Template</label>
            <select value={template} onChange={(e) => setTemplate(e.target.value)}>
              <option value="">None</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {!isNew && versions.length > 0 && (
          <div className="version-list">
            {versions.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`version-pill ${selectedVersion === v.version ? "active" : ""}`}
                onClick={() => {
                  setSelectedVersion(v.version);
                  setContent(v.content);
                }}
              >
                v{v.version}
              </button>
            ))}
          </div>
        )}
        <textarea value={content} onChange={(e) => setContent(e.target.value)} />
        {diff && (
          <div className="diff-view">
            <strong>Diff from v{(selectedVersion ?? 1) - 1} → v{selectedVersion}</strong>
            {diff.removed.map((l, i) => (
              <div key={`r${i}`} className="diff-removed">
                - {l}
              </div>
            ))}
            {diff.added.map((l, i) => (
              <div key={`a${i}`} className="diff-added">
                + {l}
              </div>
            ))}
          </div>
        )}
        <button type="submit">{isNew ? "Publish Post" : "Save New Version"}</button>
      </form>
    </>
  );
}

/** COMM-018: Agent proposal approval UI */
function ProposalsPage() {
  const [proposals, setProposals] = useState<Post[]>([]);
  const [selected, setSelected] = useState<Post | null>(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    api.posts("proposed").then((r) => setProposals(r.posts));
  }, []);

  async function viewProposal(p: Post) {
    setSelected(p);
    const r = await api.post(p.id);
    setContent(r.latestVersion.content);
  }

  async function approve() {
    if (!selected) return;
    await api.approvePost(selected.id);
    setProposals((prev) => prev.filter((p) => p.id !== selected.id));
    setSelected(null);
  }

  async function reject() {
    if (!selected) return;
    await api.rejectPost(selected.id, "Rejected via UI");
    setProposals((prev) => prev.filter((p) => p.id !== selected.id));
    setSelected(null);
  }

  return (
    <>
      <div className="page-header">
        <h2>Agent Proposals</h2>
        <p>Review and approve posts proposed by agents</p>
      </div>
      {proposals.length === 0 ? (
        <p className="empty">No pending proposals.</p>
      ) : (
        <div className="proposals-layout">
          <div className="thread-list">
            {proposals.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`thread-card proposal-card ${selected?.id === p.id ? "active" : ""}`}
                onClick={() => viewProposal(p)}
              >
                <h3>{p.title}</h3>
                <div className="thread-meta">
                  <span>proposed</span>
                  {p.template && <span>{p.template}</span>}
                </div>
              </button>
            ))}
          </div>
          {selected && (
            <div className="proposal-preview">
              <h3>{selected.title}</h3>
              <pre>{content}</pre>
              <div className="modal-actions">
                <button className="secondary" onClick={reject}>
                  Reject
                </button>
                <button onClick={approve}>Approve & Publish</button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function PostsListPage() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    api.posts().then((r) => setPosts(r.posts));
  }, []);

  return (
    <>
      <div className="page-header">
        <h2>Posts</h2>
        <p>Versioned durable documents</p>
      </div>
      <div className="thread-list">
        {posts.map((p) => (
          <Link key={p.id} to={`/posts/${p.id}`} className="thread-card">
            <h3>{p.title}</h3>
            <div className="thread-meta">
              <span>{p.status}</span>
              {p.template && <span>{p.template}</span>}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export function App() {
  const { user, setUser, loading } = useAuth();

  if (loading) return <p className="empty">Loading…</p>;
  if (!user) return <LoginPage onLogin={setUser} />;

  return (
    <Layout user={user}>
      <Routes>
        <Route path="/" element={<Navigate to="/channel/eng" replace />} />
        <Route path="/channel/:slug" element={<ChannelPage />} />
        <Route path="/thread/:id" element={<ThreadPage />} />
        <Route path="/posts" element={<PostsListPage />} />
        <Route path="/posts/new" element={<PostEditorPage />} />
        <Route path="/posts/proposals" element={<ProposalsPage />} />
        <Route path="/posts/:id" element={<PostEditorPage />} />
      </Routes>
    </Layout>
  );
}
