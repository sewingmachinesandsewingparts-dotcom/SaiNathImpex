// src/app/admin/products/bulk-assign/page.jsx
"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import api from "@/src/utils/api";
import { toast } from "sonner";

export default function BulkAssignImages() {
  const [zipFile, setZipFile] = useState(null);
  const [startSku, setStartSku] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!zipFile || !startSku) {
      toast.error("Select a zip file and provide a starting SKU.");
      return;
    }
    setProcessing(true);
    try {
      // The API expects a multipart/form-data with the folder uploaded.
      const form = new FormData();
      form.append("zipFile", zipFile);
      form.append("startSku", startSku);
      const response = await fetch('/api/parts/bulk-assign', {
        method: 'POST',
        body: form,
        // No explicit Content-Type; fetch will set multipart/form-data with proper boundary
      });
        if (!response.ok) {
          let errMessage = "Bulk assign failed";
          try {
            const errJson = await response.json();
            errMessage = errJson.message || errMessage;
          } catch (_) {
            const errText = await response.text();
            errMessage = errText || errMessage;
          }
          throw new Error(errMessage);
        }
      toast.success("Images assignment started. Check server logs for progress.");
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <section className="max-w-3xl mx-auto p-6 bg-card rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Bulk Assign Product Images</h1>
      <p className="mb-4 text-muted-foreground">
        Upload a folder (as a zip) containing JPEG images named 1.jpeg, 2.jpeg… and provide the SKU of the first product. The server will map each image to sequential SKUs (e.g., 80001‑80025).
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Image folder (zip)</label>
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setZipFile(e.target.files[0])}
            className="block w-full text-sm border border-border rounded-md p-1"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Starting SKU</label>
          <input
            type="text"
            value={startSku}
            onChange={(e) => setStartSku(e.target.value)}
            placeholder="80001"
            className="block w-full h-10 px-3 bg-secondary/50 border border-border rounded-md focus:ring-1 focus:ring-copper"
          />
        </div>
        <button
          type="submit"
          disabled={processing}
          className="flex items-center gap-2 h-10 px-5 bg-emerald-700 text-bone hover:bg-emerald-600 font-mono text-[11px] uppercase tracking-widest transition-colors"
        >
          <Upload className="h-4 w-4" />
          {processing ? "Processing…" : "Start Assignment"}
        </button>
      </form>
    </section>
  );
}
