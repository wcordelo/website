export type ComplianceStatus = "compatible" | "incompatible" | "unknown";

export interface PackageNode {
  name: string;
  version: string;
  isNative: boolean;
  dependencies: string[];
}

export interface DependencyGraph {
  root: string;
  nodes: Record<string, PackageNode>;
  nativeModules: string[];
}

export interface ExpoSdkInfo {
  sdkVersion: number | null;
  expoVersion: string | null;
  reactNativeVersion: string | null;
  source: "package.json" | "app.config" | "unknown";
}

export interface ComplianceEntry {
  package: string;
  version: string;
  status: ComplianceStatus;
  notes?: string;
}

export interface ComplianceIssue {
  package: string;
  version: string;
  status: ComplianceStatus;
  message: string;
}

export interface ElfAlignmentResult {
  file: string;
  pageSize: number;
  aligned: boolean;
  stub: boolean;
}

export interface BreakingChange {
  id: string;
  fromSdk: number;
  toSdk: number;
  title: string;
  description: string;
  affectedPackages: string[];
  severity: "low" | "medium" | "high" | "critical";
  fixHint?: string;
}

export interface UpgradeStep {
  action: "bump" | "codemod" | "manual" | "config";
  target: string;
  from?: string;
  to?: string;
  reason: string;
}

export interface UpgradePlan {
  currentSdk: number | null;
  targetSdk: number;
  steps: UpgradeStep[];
  breakingChanges: BreakingChange[];
  estimatedEffort: "low" | "medium" | "high";
}

export type PreflightSeverity = "error" | "warning" | "info";
export type PreflightStore = "apple" | "google";

export interface PreflightRule {
  id: string;
  store: PreflightStore;
  title: string;
  description: string;
  severity: PreflightSeverity;
  check: string;
}

export interface PreflightViolation {
  ruleId: string;
  store: PreflightStore;
  title: string;
  severity: PreflightSeverity;
  message: string;
  passed: boolean;
}

export interface ScanResult {
  path: string;
  scannedAt: string;
  graph: DependencyGraph;
  expo: ExpoSdkInfo;
  compliance: {
    issues: ComplianceIssue[];
    summary: { compatible: number; incompatible: number; unknown: number };
  };
  elfChecks: ElfAlignmentResult[];
  preflight: PreflightViolation[];
  healthScore: number;
}

export interface FixSuggestion {
  issueId: string;
  description: string;
  confidence: number;
  strategy: "codemod" | "manual" | "ai";
  automated: boolean;
}

export type ScanJobStatus = "queued" | "running" | "completed" | "failed";

export interface ScanJob {
  id: string;
  projectPath: string;
  status: ScanJobStatus;
  createdAt: string;
  completedAt?: string;
  result?: ScanResult;
  error?: string;
}

export interface AgencyApp {
  id: string;
  name: string;
  path: string;
  healthScore: number;
  lastScannedAt?: string;
  sdkVersion: number | null;
}

export interface AgencyPortfolio {
  apps: AgencyApp[];
  aggregateHealthScore: number;
  scannedAt: string;
}

export interface AabAnalysisResult {
  file: string;
  bundleId: string | null;
  versionCode: number | null;
  nativeLibs: string[];
  elfChecks: ElfAlignmentResult[];
  compliant: boolean;
  stub: boolean;
}

export interface PrivacyManifestIssue {
  path: string;
  rule: string;
  severity: PreflightSeverity;
  message: string;
  passed: boolean;
}

export interface PrivacyManifestResult {
  path: string;
  exists: boolean;
  issues: PrivacyManifestIssue[];
  valid: boolean;
}

export type FeedbackStatus = "pending" | "accepted" | "rejected";

export interface FeedbackSubmission {
  id: string;
  findingId: string;
  projectPath: string;
  reason: string;
  status: FeedbackStatus;
  submittedAt: string;
}

export interface EasOAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export interface EasToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  accountId: string;
}

export interface FixBranchSpec {
  branchName: string;
  baseBranch: string;
  title: string;
  body: string;
  files: Array<{ path: string; content: string }>;
  pullRequestUrl?: string;
}

export interface SlackAlertPayload {
  channel?: string;
  healthScore: number;
  projectName: string;
  criticalCount: number;
  scanUrl?: string;
}
