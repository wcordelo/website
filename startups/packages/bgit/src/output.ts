export interface OutputOptions {
  json?: boolean;
}

export function emit<T>(data: T, options: OutputOptions, human?: string): void {
  if (options.json) {
    console.log(JSON.stringify({ ok: true, ...((typeof data === "object" && data !== null) ? data : { data }) }, null, 2));
    return;
  }
  if (human) console.log(human);
}

export function emitError(message: string, options: OutputOptions, code = 1): never {
  if (options.json) {
    console.log(JSON.stringify({ ok: false, error: message }));
  } else {
    console.error(`error: ${message}`);
  }
  process.exit(code);
}
