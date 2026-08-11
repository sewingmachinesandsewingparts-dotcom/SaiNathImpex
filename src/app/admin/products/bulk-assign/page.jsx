<<<<<<< HEAD
"use client";

import { useState } from "react";
import { Upload, CheckCircle, AlertTriangle, XCircle, Play } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/src/components/admin-shell";
=======
// src/app/admin/products/bulk-assign/page.jsx
"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import api from "@/src/utils/api";
import { toast } from "sonner";
>>>>>>> d447521dc2ed2fd33b360fec0a5f1ba97ad4b0e0

export default function BulkAssignImages() {
  const [zipFile, setZipFile] = useState(null);
  const [startSku, setStartSku] = useState("");
<<<<<<< HEAD
  const [endSku, setEndSku] = useState("");
  
  const [validating, setValidating] = useState(false);
  const [preflightData, setPreflightData] = useState(null);
  
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!zipFile || !startSku || !endSku) {
      toast.error("Please provide a zip file, starting SKU, and ending SKU.");
      return;
    }
    
    setValidating(true);
    setPreflightData(null);
    setExecutionResult(null);

    try {
      const form = new FormData();
      form.append("zipFile", zipFile);
      form.append("startSku", startSku);
      form.append("endSku", endSku);

      const response = await fetch('/api/parts/bulk-assign/preflight', {
        method: 'POST',
        body: form,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Preflight validation failed");
      }

      setPreflightData(data);
      if (data.isValid) {
        toast.success("Validation successful. Ready to execute.");
      } else {
        toast.warning("Validation found issues. Please fix and try again.");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleExecute = async () => {
    if (!preflightData || !preflightData.isValid) return;
    
    setExecuting(true);
    try {
      const response = await fetch('/api/parts/bulk-assign/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ batchId: preflightData.batchId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Execution failed");
      }

      setExecutionResult(data);
      if (data.failureCount > 0) {
        toast.warning(`Completed with ${data.failureCount} errors.`);
      } else {
        toast.success("Bulk assignment completed successfully!");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExecuting(false);
=======
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
>>>>>>> d447521dc2ed2fd33b360fec0a5f1ba97ad4b0e0
    }
  };

  return (
<<<<<<< HEAD
    <AdminShell title="Bulk Assign Images" subtitle="Upload a ZIP to bulk map product images">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Step 1: Input Form */}
        <section className="bg-card p-6 rounded-lg shadow hairline">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-copper">
            <span className="bg-secondary px-2 py-1 rounded text-sm">01</span> Configuration
          </h2>
          <form onSubmit={handleValidate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-1">
              <label className="block text-sm font-medium">Starting SKU</label>
              <input
                type="text"
                value={startSku}
                onChange={(e) => setStartSku(e.target.value)}
                placeholder="e.g. PG80001"
                className="block w-full h-10 px-3 bg-secondary/50 border border-border rounded-md focus:ring-1 focus:ring-copper"
              />
            </div>
            
            <div className="md:col-span-1 space-y-1">
              <label className="block text-sm font-medium">Ending SKU</label>
              <input
                type="text"
                value={endSku}
                onChange={(e) => setEndSku(e.target.value)}
                placeholder="e.g. PG80025"
                className="block w-full h-10 px-3 bg-secondary/50 border border-border rounded-md focus:ring-1 focus:ring-copper"
              />
            </div>

            <div className="md:col-span-1 space-y-1">
              <label className="block text-sm font-medium">Image ZIP File</label>
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setZipFile(e.target.files[0])}
                className="block w-full text-sm border border-border rounded-md p-1 h-10 bg-secondary/50"
              />
            </div>

            <div className="md:col-span-3 flex justify-end mt-2">
              <button
                type="submit"
                disabled={validating || executing}
                className="flex items-center gap-2 h-10 px-6 bg-ink text-bone hover:bg-copper font-mono text-[11px] uppercase tracking-widest transition-colors rounded"
              >
                {validating ? (
                  <span className="animate-pulse">Validating...</span>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Validate ZIP
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Step 2: Preflight Report */}
        {preflightData && !executionResult && (
          <section className="bg-card p-6 rounded-lg shadow hairline animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-copper">
              <span className="bg-secondary px-2 py-1 rounded text-sm">02</span> Validation Report
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-secondary/50 rounded border border-border flex flex-col items-center">
                <span className="text-2xl font-bold">{preflightData.expectedCount}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Expected</span>
              </div>
              <div className="p-4 bg-secondary/50 rounded border border-border flex flex-col items-center">
                <span className="text-2xl font-bold">{preflightData.filesFound}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Files in ZIP</span>
              </div>
              <div className="p-4 bg-secondary/50 rounded border border-border flex flex-col items-center">
                <span className="text-2xl font-bold text-emerald-500">{preflightData.mapping.length}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Mapped</span>
              </div>
              <div className="p-4 bg-secondary/50 rounded border border-border flex flex-col items-center">
                <span className="text-2xl font-bold text-red-500">
                  {preflightData.missingImages.length + preflightData.extraImages.length + preflightData.productsNotFound.length}
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Errors</span>
              </div>
            </div>

            {preflightData.missingImages.length > 0 && (
              <div className="mb-4 p-4 border border-red-900/30 bg-red-900/10 rounded-lg">
                <h3 className="font-bold text-red-500 flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" /> Missing Images
                </h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {preflightData.missingImages.map(m => <li key={m}>{m}</li>)}
                </ul>
              </div>
            )}

            {preflightData.extraImages.length > 0 && (
              <div className="mb-4 p-4 border border-amber-900/30 bg-amber-900/10 rounded-lg">
                <h3 className="font-bold text-amber-500 flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4" /> Extra Images (will be ignored)
                </h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {preflightData.extraImages.map(m => <li key={m}>{m}</li>)}
                </ul>
              </div>
            )}

            {preflightData.productsNotFound.length > 0 && (
              <div className="mb-4 p-4 border border-red-900/30 bg-red-900/10 rounded-lg">
                <h3 className="font-bold text-red-500 flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4" /> Products Not Found in Database
                </h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {preflightData.productsNotFound.map(m => <li key={m}>{m}</li>)}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between mt-6 p-4 bg-secondary rounded border border-border">
              <div className="flex items-center gap-3">
                {preflightData.isValid ? (
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500" />
                )}
                <span className="font-medium">
                  {preflightData.isValid ? "Ready to upload!" : "Cannot proceed. Please fix the errors above."}
                </span>
              </div>
              <button
                onClick={handleExecute}
                disabled={!preflightData.isValid || executing}
                className="flex items-center gap-2 h-10 px-6 bg-emerald-700 text-bone hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-700 font-mono text-[11px] uppercase tracking-widest transition-colors rounded"
              >
                {executing ? (
                  <span className="animate-pulse">Uploading...</span>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Start Upload
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Execution Result */}
        {executionResult && (
          <section className="bg-card p-6 rounded-lg shadow hairline animate-in fade-in">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-copper">
              <span className="bg-secondary px-2 py-1 rounded text-sm">03</span> Execution Complete
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-emerald-900/10 rounded border border-emerald-900/30 flex flex-col items-center">
                <span className="text-3xl font-bold text-emerald-500">{executionResult.successCount}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Successful</span>
              </div>
              <div className="p-4 bg-red-900/10 rounded border border-red-900/30 flex flex-col items-center">
                <span className="text-3xl font-bold text-red-500">{executionResult.failureCount}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Failed</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm mb-2">Detailed Log:</h3>
              <div className="max-h-60 overflow-y-auto border border-border rounded bg-secondary/50 p-2 text-sm font-mono">
                {executionResult.results.map((res, i) => (
                  <div key={i} className={`py-1 ${res.status === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                    [{res.status.toUpperCase()}] {res.sku}: {res.status === 'success' ? 'Uploaded' : res.error}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </div>
    </AdminShell>
=======
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
>>>>>>> d447521dc2ed2fd33b360fec0a5f1ba97ad4b0e0
  );
}
