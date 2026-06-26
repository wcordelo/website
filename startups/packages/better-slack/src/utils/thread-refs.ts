/** COMM-007: Cross-thread reference parsing — >>thread:<id> */

export const THREAD_REF_PATTERN = />>(?:thread:)?([a-f0-9-]{36})/gi;

export interface ThreadRef {
  threadId: string;
  match: string;
  index: number;
}

export function parseThreadRefs(text: string): ThreadRef[] {
  const refs: ThreadRef[] = [];
  const pattern = new RegExp(THREAD_REF_PATTERN.source, "gi");
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    refs.push({
      threadId: match[1]!,
      match: match[0],
      index: match.index,
    });
  }
  return refs;
}

export function stripThreadRefs(text: string): string {
  return text.replace(THREAD_REF_PATTERN, "").trim();
}
