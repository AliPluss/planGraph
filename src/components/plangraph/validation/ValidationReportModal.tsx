'use client';

import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ValidationReport } from '@/core/types';

interface ValidationReportModalProps {
  open: boolean;
  report: ValidationReport;
  stepTitle: string;
  onMarkDone: () => void;
  onKeepReview: () => void;
  working?: boolean;
}

export function ValidationReportModal({
  open,
  report,
  stepTitle,
  onMarkDone,
  onKeepReview,
  working = false,
}: ValidationReportModalProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onKeepReview()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-orange-500" />
            Step needs review
          </DialogTitle>
          <DialogDescription>
            {stepTitle} completed, but automated validation found issues.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            {report.summary}
          </p>
          <CheckRow
            label="Protected files"
            passed={report.checks.protectedFiles.passed}
            items={report.checks.protectedFiles.violations}
          />
          <CheckRow
            label="Secret leaks"
            passed={report.checks.secretLeaks.passed}
            items={report.checks.secretLeaks.matches.map((match) => `${match.file}: ${match.pattern}`)}
          />
          <CheckRow
            label="Build still works"
            passed={!report.checks.buildStillWorks.ran || report.checks.buildStillWorks.passed}
            items={
              report.checks.buildStillWorks.ran && !report.checks.buildStillWorks.passed
                ? [report.checks.buildStillWorks.output ?? 'Build failed']
                : [report.checks.buildStillWorks.ran ? 'Build passed' : 'No build script; skipped']
            }
          />
          <CheckRow
            label="Report present"
            passed={report.checks.reportPresent.passed}
            items={[report.checks.reportPresent.path ?? 'reports/<stepId>_report.md']}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onKeepReview} disabled={working}>
            Keep as Needs Review
          </Button>
          <Button onClick={onMarkDone} disabled={working}>
            Mark step Done anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckRow({
  label,
  passed,
  items,
}: {
  label: string;
  passed: boolean;
  items: string[];
}) {
  return (
    <section className="rounded-md border px-3 py-2">
      <div className="flex items-center gap-2">
        {passed ? (
          <CheckCircle2 className="size-4 text-emerald-600" />
        ) : (
          <XCircle className="size-4 text-destructive" />
        )}
        <h3 className="text-sm font-medium">{label}</h3>
      </div>
      {!passed && items.length > 0 && (
        <ul className="mt-2 space-y-1">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="font-mono text-xs text-muted-foreground break-all">
              {item}
            </li>
          ))}
        </ul>
      )}
      {passed && (
        <p className="mt-1 text-xs text-muted-foreground">Passed</p>
      )}
    </section>
  );
}
