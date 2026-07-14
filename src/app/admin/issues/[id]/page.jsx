import Link from "next/link";
import connectMongo from "@/src/lib/mongo";
import Issue from "@/src/models/Issue";
import { AdminShell } from "@/src/components/admin-shell";
import { ArrowUpRight } from "lucide-react";

const statusLabels = {
  open: "Open",
  pending: "Pending",
  in_working: "In working",
  seen: "Seen",
  resolved: "Resolved",
};

export default async function IssueDetailsPage({ params }) {
  await connectMongo();
  const { id } = await params;
  const issue = await Issue.findOne({ id });

  if (!issue) {
    return (
      <AdminShell title="Issue details" subtitle="Support ticket not found">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Issue not found.
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={`Issue ${issue.id}`} subtitle="Support ticket details">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Support ticket</div>
            <h1 className="font-display text-4xl mt-2">{issue.subject.replace("_", " ")}</h1>
          </div>
          <Link href="/admin/issues" className="text-[11px] uppercase tracking-[0.18em] text-copper hover:underline">
            Back to issues
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Status</div>
            <div className="mt-3 text-sm font-semibold">{statusLabels[issue.status] || issue.status}</div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Submitted by</div>
            <div className="mt-3 text-sm font-semibold">{issue.user}</div>
            {issue.phone && <div className="text-sm text-muted-foreground">{issue.phone}</div>}
          </div>
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Created</div>
            <div className="mt-3 text-sm">{issue.at}</div>
            {issue.location && <div className="text-sm text-muted-foreground">{issue.location}</div>}
          </div>
        </div>

        <div className="rounded-4xl border border-border bg-card p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Issue description</div>
              <p className="mt-3 text-sm leading-relaxed text-foreground">{issue.description}</p>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Repair assignment</div>
              {issue.assignedTo || issue.repairPhone ? (
                <div className="mt-3 text-sm leading-relaxed text-foreground space-y-2">
                  <div>
                    <span className="font-semibold">Technician:</span> {issue.assignedTo || "Not assigned"}
                  </div>
                  {issue.repairPhone && (
                    <div>
                      <span className="font-semibold">Phone:</span> {issue.repairPhone}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 text-sm text-muted-foreground">No repair person assigned yet.</div>
              )}
            </div>
          </div>
        </div>

        {issue.images?.length > 0 && (
          <div className="rounded-4xl border border-border bg-card p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Attached images</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {issue.images.map((src, index) => (
                <div key={`${src}-${index}`} className="overflow-hidden rounded-3xl bg-background aspect-square">
                  <img
                    src={src}
                    alt={`Issue attachment ${index + 1}`}
                    className="h-full w-full object-cover object-left-top"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-4xl border border-border bg-card p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Actions</div>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em]">
            <Link
              href={`/admin/issues/${issue.id}`}
              className="inline-flex items-center gap-2 rounded-3xl bg-secondary px-4 py-3 text-sm text-muted-foreground"
            >
              <ArrowUpRight className="h-4 w-4" /> Refresh details
            </Link>
            <Link
              href={`/admin/issues`}
              className="inline-flex items-center gap-2 rounded-3xl bg-copper px-4 py-3 text-sm text-copper-foreground"
            >
              Back to issues
            </Link>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
