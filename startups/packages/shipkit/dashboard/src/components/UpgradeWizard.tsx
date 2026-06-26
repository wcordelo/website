import { useState } from "react";

interface UpgradeStep {
  action: string;
  target: string;
  to?: string;
  reason: string;
}

interface UpgradeWizardProps {
  currentSdk: number | null;
  targetSdk: number;
  steps: UpgradeStep[];
  effort: string;
}

const STEP_LABELS = ["Assess", "Plan", "Apply", "Verify"];

export function UpgradeWizard({ currentSdk, targetSdk, steps, effort }: UpgradeWizardProps) {
  const [step, setStep] = useState(0);

  return (
    <section className="wizard">
      <div className="wizard__steps">
        {STEP_LABELS.map((label, i) => (
          <div
            key={label}
            className={`wizard__step${i === step ? " wizard__step--active" : ""}${i < step ? " wizard__step--done" : ""}`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="wizard__content">
        {step === 0 && (
          <>
            <h3>Current State</h3>
            <p>
              Expo SDK {currentSdk ?? "unknown"} → target SDK {targetSdk}. Estimated effort:{" "}
              <strong>{effort}</strong>.
            </p>
          </>
        )}
        {step === 1 && (
          <>
            <h3>Upgrade Plan ({steps.length} steps)</h3>
            <ul>
              {steps.slice(0, 5).map((s, i) => (
                <li key={i}>
                  [{s.action}] {s.target}
                  {s.to ? ` → ${s.to}` : ""}: {s.reason}
                </li>
              ))}
            </ul>
          </>
        )}
        {step === 2 && (
          <>
            <h3>Apply Changes</h3>
            <p>Run codemods and package bumps. ShipKit can open a fix branch via GitHub integration.</p>
          </>
        )}
        {step === 3 && (
          <>
            <h3>Verify & Ship</h3>
            <p>Re-scan, run preflight checks, and submit to stores with confidence.</p>
          </>
        )}
      </div>

      <div className="wizard__actions">
        {step > 0 && (
          <button type="button" className="secondary" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < STEP_LABELS.length - 1 ? (
          <button type="button" className="primary" onClick={() => setStep(step + 1)}>
            Next
          </button>
        ) : (
          <button type="button" className="primary" onClick={() => setStep(0)}>
            Start Over
          </button>
        )}
      </div>
    </section>
  );
}
