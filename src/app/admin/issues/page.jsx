"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AdminShell } from "@/src/components/admin-shell";
import { ArrowUpRight, Share2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/src/utils/api";

const statusLabels = {
  open: "Open",
  pending: "Pending",
  in_working: "In working",
  seen: "Seen",
  resolved: "Resolved",
};

const subjects = {
  machine: "Machine",
  machine_part: "Machine part",
  website: "Website",
  other: "Other",
};

export default function AdminIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [editingAssignment, setEditingAssignment] = useState({});

  useEffect(() => {
    api("/api/issues")
      .then((r) => r.data)
      .then((data) => {
        setIssues(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const groupedIssues = issues.reduce((groups, issue) => {
    const category = subjects[issue.subject] || issue.subject || "Other";
    groups[category] = groups[category] || [];
    groups[category].push(issue);
    return groups;
  }, {});

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const res = await api("/api/issues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify({ id, status }),
      });
      const updated = res.data;
      setIssues((current) => current.map((issue) => (issue.id === updated.id ? updated : issue)));
    } catch (error) {
      console.error(error);
      const message = error?.response?.data?.message || error.message || "Unable to update status";
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignmentChange = (id, field, value) => {
    setAssignments((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  };

  const startAssignmentEdit = (issue) => {
    setEditingAssignment((current) => ({ ...current, [issue.id]: true }));
    setAssignments((current) => ({
      ...current,
      [issue.id]: { assignedTo: "", repairPhone: "" },
    }));
  };

  const assignRepairContact = async (issue) => {
    const assignment = assignments[issue.id] || {};
    const assignedTo = assignment.assignedTo?.trim() || issue.assignedTo?.trim() || "";
    const repairPhone = assignment.repairPhone?.trim() || issue.repairPhone?.trim() || "";

    if (!assignedTo && !repairPhone) {
      toast.error("Enter a repair person name or phone number before saving.");
      return;
    }

    const payload = {
      id: issue.id,
      assignedTo,
      repairPhone,
    };

    setUpdatingId(issue.id);
    try {
      const res = await api("/api/issues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        data: JSON.stringify(payload),
      });
      const updated = res.data;
      setIssues((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setAssignments((current) => ({
        ...current,
        [issue.id]: {
          assignedTo: updated.assignedTo,
          repairPhone: updated.repairPhone,
        },
      }));
      setEditingAssignment((current) => ({
        ...current,
        [issue.id]: false,
      }));
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Unable to assign repair contact.");
    } finally {
      setUpdatingId(null);
    }
  };

  const buildWhatsAppLink = (issue) => {
    const message = `Issue ID: ${issue.id}%0AStatus: ${statusLabels[issue.status] || issue.status}%0AUser: ${issue.user}%0APhone: ${issue.phone || "N/A"}%0ALocation: ${issue.location || "N/A"}%0ADescription: ${issue.description}`;
    return `https://wa.me/?text=${message}`;
  };

  return (
    <AdminShell title="Support Issues" subtitle="Manage customer support tickets">
      {loading ? (
        <div className="hairline bg-card p-10 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Loading tickets...
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedIssues).map(([category, items]) => (
            <section key={category} className="space-y-4">
              <div className="font-display text-2xl">{category}</div>
              <div className="grid lg:grid-cols-2 gap-4">
                {items.map((i) => (
                  <div
                    key={i.id}
                    className="hairline bg-card p-6 flex flex-col hover:bg-secondary/10 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4 gap-4">
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                          {i.at}
                        </div>
                        <div className="font-medium">{subjects[i.subject] || i.subject}</div>
                      </div>
                      <span
                        className={`font-mono text-[10px] tracking-widest uppercase px-2 py-1 ${
                          i.status === "resolved"
                            ? "bg-success text-bone"
                            : i.status === "open"
                            ? "bg-copper text-copper-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {statusLabels[i.status] || i.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                      {i.description}
                    </div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <Link
                        href={`/admin/issues/${i.id}`}
                        className="text-[11px] uppercase tracking-[0.18em] text-copper hover:underline"
                      >
                        {i.assignedTo
                          ? `Assigned: ${i.assignedTo}${i.repairPhone ? ` • ${i.repairPhone}` : ""}`
                          : "View issue details"}
                      </Link>
                      <span className="text-[11px] text-muted-foreground">
                        {i.assignedTo || i.repairPhone ? "Details page available" : "No repairer assigned yet"}
                      </span>
                    </div>
                    <div className="space-y-3 mb-4">
                      {(i.assignedTo || i.repairPhone) && (
                        <div className="text-sm text-foreground">
                          <div className="font-semibold">Repair Assigned</div>
                          <div>{i.assignedTo || "Technician not assigned"}</div>
                          {i.repairPhone ? <div>{i.repairPhone}</div> : null}
                        </div>
                      )}
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          value={editingAssignment[i.id] ? assignments[i.id]?.assignedTo ?? "" : assignments[i.id]?.assignedTo ?? i.assignedTo ?? ""}
                          onChange={(e) => handleAssignmentChange(i.id, "assignedTo", e.target.value)}
                          placeholder="Repair person name"
                          className="h-10 px-3 hairline bg-background text-sm outline-none"
                        />
                        <input
                          value={editingAssignment[i.id] ? assignments[i.id]?.repairPhone ?? "" : assignments[i.id]?.repairPhone ?? i.repairPhone ?? ""}
                          onChange={(e) => handleAssignmentChange(i.id, "repairPhone", e.target.value)}
                          placeholder="Repair phone number"
                          className="h-10 px-3 hairline bg-background text-sm outline-none"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {editingAssignment[i.id]
                          ? "Enter the new repairer details and click Save changes."
                          : i.assignedTo || i.repairPhone
                          ? "Current repairer shown above. Click Update to change."
                          : "Fill repair person and phone, then click Save changes."}
                      </div>
                      {editingAssignment[i.id] ? (
                        <button
                          type="button"
                          disabled={updatingId === i.id}
                          onClick={() => assignRepairContact(i)}
                          className="mt-2 h-10 px-4 bg-copper text-bone text-[11px] uppercase tracking-[0.18em] hover:bg-copper/90 transition-colors"
                        >
                          Save changes
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={updatingId === i.id}
                          onClick={() => startAssignmentEdit(i)}
                          className="mt-2 h-10 px-4 bg-secondary text-muted-foreground text-[11px] uppercase tracking-[0.18em] hover:bg-secondary/90 transition-colors"
                        >
                          {i.assignedTo || i.repairPhone ? "Update repair contact" : "Save changes"}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Object.entries(statusLabels)
                        .filter(([value]) => value !== i.status)
                        .map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            disabled={updatingId === i.id}
                            onClick={() => updateStatus(i.id, value)}
                            className="h-9 px-3 bg-secondary/80 text-muted-foreground text-[11px] uppercase tracking-[0.18em] hover:bg-secondary transition-colors"
                          >
                            {label}
                          </button>
                        ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-border pt-4 mt-auto gap-2">
                      <div className="text-sm flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center font-mono text-[10px]">
                          {i.user.charAt(0)}
                        </span>
                        {i.user}
                      </div>
                      <a
                        href={buildWhatsAppLink(i)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-copper font-mono text-[11px] uppercase tracking-widest hover:underline"
                      >
                        <Share2 className="h-3.5 w-3.5" /> Share
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {issues.length === 0 && (
            <div className="hairline bg-card p-10 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
              No open issues
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
