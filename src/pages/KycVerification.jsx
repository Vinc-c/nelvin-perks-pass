import React, { useState } from "react";
import { motion } from "framer-motion";
import PortalLayout from "@/components/PortalLayout";
import { Upload, FileText, Check, Clock, X, ShieldCheck, Building2, Store } from "lucide-react";

const steps = [
  { key: "submitted", label: "Documents submitted", icon: Upload },
  { key: "review", label: "Admin review", icon: Clock },
  { key: "verified", label: "Verification complete", icon: ShieldCheck },
];

const requiredDocs = [
  "Business registration certificate",
  "Tax identification document",
  "Bank account proof",
  "Director ID / passport",
];

export default function KycVerification() {
  const [accountType, setAccountType] = useState("merchant");
  const [uploaded, setUploaded] = useState([]);
  const [status, setStatus] = useState("pending");

  const toggleDoc = (doc) =>
    setUploaded((p) => (p.includes(doc) ? p.filter((d) => d !== doc) : [...p, doc]));

  const submit = () => {
    if (uploaded.length === requiredDocs.length) setStatus("review");
  };

  const currentStep = status === "pending" ? 0 : status === "review" ? 1 : 2;

  return (
    <PortalLayout title="KYC Verification" theme="light">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Business Verification</h1>
          <p className="text-sm text-slate-500">Submit your documents and track your verification status.</p>
        </div>
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-0.5">
          <button onClick={() => setAccountType("merchant")} className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${accountType === "merchant" ? "bg-emerald-500 text-white" : "text-slate-600"}`}>
            <Store className="h-4 w-4" /> Merchant
          </button>
          <button onClick={() => setAccountType("company")} className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${accountType === "company" ? "bg-emerald-500 text-white" : "text-slate-600"}`}>
            <Building2 className="h-4 w-4" /> Company
          </button>
        </div>
      </div>

      {/* Status tracker */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = i <= currentStep;
            return (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center text-center">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${done ? "bg-emerald-500 text-white" : "border border-slate-200 bg-slate-50 text-slate-400"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className={`mt-2 text-xs ${done ? "text-slate-900" : "text-slate-400"}`}>{s.label}</p>
                </div>
                {i < steps.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${i < currentStep ? "bg-emerald-500" : "bg-slate-200"}`} />}
              </React.Fragment>
            );
          })}
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 p-4">
          {status === "verified" ? <Check className="h-5 w-5 text-emerald-600" /> : status === "review" ? <Clock className="h-5 w-5 text-amber-500" /> : <X className="h-5 w-5 text-rose-500" />}
          <p className="text-sm text-slate-600">
            {status === "verified" ? "Your business is verified. You can now publish campaigns and receive payouts." :
             status === "review" ? "Your documents are under admin review. This usually takes 24–48 hours." :
             "Please upload all required documents to start verification."}
          </p>
        </div>
      </motion.div>

      {/* Document upload */}
      <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900"><FileText className="h-5 w-5 text-emerald-600" /> Required documents</h3>
        <div className="mt-4 space-y-2">
          {requiredDocs.map((doc) => {
            const isUploaded = uploaded.includes(doc);
            return (
              <div key={doc} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${isUploaded ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"}`}>
                    {isUploaded ? <Check className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                  </div>
                  <span className="text-sm text-slate-700">{doc}</span>
                </div>
                <button
                  onClick={() => toggleDoc(doc)}
                  disabled={status === "review" || status === "verified"}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${isUploaded ? "text-rose-600 hover:bg-rose-50" : "bg-emerald-500 text-white hover:bg-emerald-600"} disabled:opacity-40`}
                >
                  {isUploaded ? "Remove" : "Upload"}
                </button>
              </div>
            );
          })}
        </div>
        {status === "pending" && (
          <button
            onClick={submit}
            disabled={uploaded.length !== requiredDocs.length}
            className="mt-5 w-full rounded-xl bg-emerald-500 py-3 font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Submit for verification ({uploaded.length}/{requiredDocs.length})
          </button>
        )}
      </motion.div>
    </PortalLayout>
  );
}