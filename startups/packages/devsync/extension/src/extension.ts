import * as vscode from "vscode";

/** SYNC-032: VS Code extension stub — status bar sync indicator. */

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext): void {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  statusBarItem.command = "devsync.showStatus";
  statusBarItem.tooltip = "DevSync — click for status";
  updateStatusBar("idle");
  statusBarItem.show();

  context.subscriptions.push(
    statusBarItem,
    vscode.commands.registerCommand("devsync.showStatus", showStatus),
    vscode.commands.registerCommand("devsync.pause", () => setSyncState("paused")),
    vscode.commands.registerCommand("devsync.resume", () => setSyncState("active")),
  );
}

export function deactivate(): void {
  statusBarItem?.dispose();
}

type SyncState = "idle" | "syncing" | "paused" | "conflict" | "active";

function updateStatusBar(state: SyncState): void {
  const icons: Record<SyncState, string> = {
    idle: "$(sync) DevSync",
    syncing: "$(sync~spin) Syncing",
    paused: "$(debug-pause) DevSync Paused",
    conflict: "$(warning) DevSync Conflict",
    active: "$(check) DevSync OK",
  };
  statusBarItem.text = icons[state];
  statusBarItem.backgroundColor =
    state === "conflict"
      ? new vscode.ThemeColor("statusBarItem.warningBackground")
      : undefined;
}

function setSyncState(state: SyncState): void {
  updateStatusBar(state);
  vscode.window.showInformationMessage(`DevSync: ${state}`);
}

async function showStatus(): Promise<void> {
  // Stub: production shells out to `devsync status` or IPC to devsyncd
  const message =
    "DevSync extension stub — run `devsync status` in terminal for full status.";
  await vscode.window.showInformationMessage(message, "Open Terminal").then((choice) => {
    if (choice === "Open Terminal") {
      vscode.commands.executeCommand("workbench.action.terminal.new");
    }
  });
}
