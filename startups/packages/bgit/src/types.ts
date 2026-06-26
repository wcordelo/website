export interface BgitConfig {
  version: string;
  created_at: string;
  repo_root: string;
}

export interface SessionIntent {
  session_id: string;
  agent: string;
  user: string;
  intent: string;
  issue_ref?: string;
  started_at: string;
  ended_at?: string;
  checkpoints: string[];
  final_commit?: string;
  head_at_start?: string;
  status: "active" | "ended";
}

export interface CheckpointRecord {
  id: string;
  session_id: string;
  created_at: string;
  head: string;
  commit?: string;
  diff_stat: DiffStat;
  files: FileTouch[];
}

export interface DiffStat {
  files_changed: number;
  insertions: number;
  deletions: number;
}

export interface FileTouch {
  path: string;
  lines?: number[];
  action: "edit" | "create" | "delete";
}

export interface TraceEvent {
  ts: string;
  type: string;
  summary: string;
  data?: Record<string, unknown>;
}

export interface WhyResult {
  file: string;
  line?: number;
  session_id: string;
  checkpoint_id?: string;
  intent: string;
  prompt_summary?: string;
  commit?: string;
  chain: string[];
}

export interface TraceResult {
  session_id: string;
  intent: string;
  agent: string;
  started_at: string;
  ended_at?: string;
  checkpoints: CheckpointRecord[];
  events: TraceEvent[];
  commits: string[];
}

export interface SecretMeta {
  name: string;
  created_at: string;
  updated_at: string;
  algorithm: "aes-256-gcm";
}

export interface EncryptedBlob {
  v: 1;
  alg: "aes-256-gcm";
  iv: string;
  tag: string;
  ciphertext: string;
  wrapped_key?: string;
}

export interface CommandResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
