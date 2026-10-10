"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const DISCOUNT_PROMOS: { [code: string]: { discount15: number; discount30: number; label: string } } = {
  DIGI500: { discount15: 200, discount30: 400, label: "Rs. 200 / Rs. 400 Discount Applied" },
  DIGI1000: { discount15: 200, discount30: 400, label: "Special Promo Applied" },
  SPECIAL: { discount15: 200, discount30: 400, label: "Special Discount Applied" },
  VIP: { discount15: 200, discount30: 400, label: "VIP Teacher Discount Applied" },
  DIGIMART: { discount15: 200, discount30: 400, label: "Digimart Offer Applied" }
};

function PayContent() {
  const searchParams = useSearchParams();
  const [teacherId, setTeacherId] = useState("");
  const [selectedPlanDays, setSelectedPlanDays] = useState<15 | 30>(30);
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    const idFromUrl = searchParams.get("id") || searchParams.get("teacher_id") || searchParams.get("username") || "";
    if (idFromUrl) {
      setTeacherId(idFromUrl);
    }
  }, [searchParams]);

  const handleApplyDiscountCode = () => {
    const code = discountCodeInput.trim().toUpperCase();
    if (!code) {
      setPromoMessage({ text: "කරුණාකර Discount Code එකක් ඇතුළත් කරන්න.", isError: true });
      return;
    }

    if (DISCOUNT_PROMOS[code]) {
      setAppliedPromo(code);
      setPromoMessage({ text: `🎉 සාර්ථකයි! ${DISCOUNT_PROMOS[code].label}`, isError: false });
    } else {
      setAppliedPromo(null);
      setPromoMessage({ text: "❌ අවලංගු Discount Code එකකි.", isError: true });
    }
  };

  const price15 = appliedPromo ? 700 - (DISCOUNT_PROMOS[appliedPromo]?.discount15 || 0) : 700;
  const price30 = appliedPromo ? 1400 - (DISCOUNT_PROMOS[appliedPromo]?.discount30 || 0) : 1400;
  const finalPayableAmount = selectedPlanDays === 15 ? price15 : price30;

  const handleSlipFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadBankSlip = async () => {
    if (!teacherId.trim()) {
      alert("⚠️ කරුණාකර ඔබගේ Teacher ID හෝ Username එක ඇතුළත් කරන්න.");
      return;
    }
    if (!slipPreview || !slipFile) {
      alert("⚠️ කරුණාකර බැංකු රිසිට්පතේ (Slip - JPG / PNG / PDF) ගොනුවක් තෝරන්න.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = slipFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const response = await fetch("https://n8n.epanthiya.com/webhook/upload-bank-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_id: teacherId.trim(),
          username: teacherId.trim(),
          image_base64: slipPreview,
          file_ext: fileExt,
          plan_days: selectedPlanDays,
          amount: finalPayableAmount,
          discount_code: appliedPromo || ""
        })
      });

      if (response.ok) {
        if (typeof window !== "undefined") {
          localStorage.setItem("digimart_slip_uploaded", "true");
        }
        setUploadSuccess(true);
      } else {
        alert("❌ Slip එක Upload කිරීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.");
      }
    } catch (error) {
      console.error("Slip upload error:", error);
      alert("⚠️ සේවාදායකයේ දෝෂයකි. කරුණාකර නැවත උත්සාහ කරන්න.");
    } finally {
      setUploading(false);
    }
  };

  const isPdf = slipFile?.type === "application/pdf" || slipFile?.name.toLowerCase().endsWith(".pdf");

  return (
    <div className="min-h-screen bg-[#070b19] text-white flex items-center justify-center p-4 selection:bg-blue-600/30">
      <div className="w-full max-w-lg bg-[#0b132b] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-2xl relative">
        
        {/* LOGO & TITLE */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950/80 border border-blue-800/60 rounded-full text-blue-300 text-xs font-bold mb-1">
            ⚡ Digimart LMS Official Portal
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
            💳 Package Renewal &amp; Slip Upload
          </h1>
          <p className="text-xs text-slate-400">
            බැංකු රිසිට්පත Upload කළ සැණින් ගිණුම ස්වයංක්‍රීයව Active (Paid) වේ.
          </p>
        </div>

        {uploadSuccess ? (
          <div className="bg-slate-950 border border-emerald-500/60 p-6 rounded-2xl text-center space-y-4 animate-fadeIn">
            <span className="text-4xl">🎉</span>
            <h2 className="text-lg font-black text-emerald-400">බැංකු රිසිට්පත සාර්ථකව ලැබුණි!</h2>
            
            <div className="bg-emerald-950/40 border border-emerald-900/60 p-4 rounded-xl text-left space-y-2 text-xs text-slate-200">
              <p className="flex items-center gap-2 text-emerald-300 font-bold">
                <span>✅</span> ඔබගේ Account එක දැන් ක්ෂණිකව Active (Paid) වී ඇත.
              </p>
              <p className="flex items-center gap-2 text-slate-300">
                <span>🚀</span> ඔබට දැන් කිසිදු බාධාවකින් තොරව Login වී Classes පැවැත්විය හැක.
              </p>
              <p className="flex items-center gap-2 text-amber-300 font-medium">
                <span>⏳</span> නව Expiry Date එක පැය 24ක් ඇතුළත පද්ධතියේ Verify වී Dashboard හි Update වනු ඇත.
              </p>
            </div>

            <div className="pt-2">
              <a
                href="/login"
                className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Go to LMS Login ➔
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* TEACHER ID OR USERNAME INPUT */}
            <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-2xl space-y-1.5">
              <label className="block text-[11px] font-bold text-gray-400">
                👤 Teacher ID / Username
              </label>
              <input
                type="text"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                placeholder="e.g. dimo74 හෝ teach_69"
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-bold text-blue-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* BANK DETAILS */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs shadow-inner">
              <h4 className="font-bold text-blue-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <span>🏛️</span> Digimart නිල බැංකු ගිණුම් විස්තර
              </h4>
              <div className="font-mono text-slate-300 space-y-1.5 text-[11px] pt-1">
                <p><span className="text-gray-500">Bank:</span> <strong className="text-white">Sampath Bank</strong></p>
                <p><span className="text-gray-500">Account Name:</span> <strong className="text-white">S.D.Nuwan Sameera Deshapriya</strong></p>
                <p>
                  <span className="text-gray-500">Account No:</span>{" "}
                  <span className="text-emerald-400 font-black text-sm select-all bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80 tracking-wider">
                    1188 5747 0946
                  </span>
                </p>
                <p><span className="text-gray-500">Branch:</span> <strong className="text-slate-300">Rambukkana Branch</strong></p>
              </div>
            </div>

            {/* SELECTABLE PLAN CARDS */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300">
                පැකේජය තෝරන්න (Click to Select)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setSelectedPlanDays(15)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border text-center relative ${
                    selectedPlanDays === 15
                      ? "bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-900/30"
                      : "bg-slate-950/60 border-slate-800/90 hover:border-slate-700 opacity-75 hover:opacity-100"
                  }`}
                >
                  {selectedPlanDays === 15 && (
                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold">
                      ✓
                    </span>
                  )}
                  <p className="text-[11px] font-bold text-gray-400">15 Days Extension</p>
                  <div className="mt-1 flex items-center justify-center gap-1.5">
                    {appliedPromo && (
                      <span className="text-xs text-gray-500 line-through font-mono">LKR 700</span>
                    )}
                    <p className="font-black text-blue-400 text-base font-mono">
                      LKR {price15.toLocaleString()}
                    </p>
                  </div>
                  {appliedPromo && (
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded mt-1 inline-block">
                      Save Rs. {700 - price15}
                    </span>
                  )}
                </div>

                <div
                  onClick={() => setSelectedPlanDays(30)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border text-center relative ${
                    selectedPlanDays === 30
                      ? "bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-900/30"
                      : "bg-slate-950/60 border-slate-800/90 hover:border-slate-700 opacity-75 hover:opacity-100"
                  }`}
                >
                  {selectedPlanDays === 30 && (
                    <span className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold">
                      ✓
                    </span>
                  )}
                  <p className="text-[11px] font-bold text-gray-400">30 Days Extension</p>
                  <div className="mt-1 flex items-center justify-center gap-1.5">
                    {appliedPromo && (
                      <span className="text-xs text-gray-500 line-through font-mono">LKR 1,400</span>
                    )}
                    <p className="font-black text-indigo-300 text-base font-mono">
                      LKR {price30.toLocaleString()}
                    </p>
                  </div>
                  {appliedPromo && (
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded mt-1 inline-block">
                      Save Rs. {1400 - price30}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* DISCOUNT PROMO INPUT */}
            <div className="space-y-1.5 bg-slate-950/50 p-3 rounded-2xl border border-slate-900">
              <label className="block text-[11px] font-bold text-gray-400">
                🏷️ Discount Code (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCodeInput}
                  onChange={(e) => {
                    setDiscountCodeInput(e.target.value);
                    if (promoMessage) setPromoMessage(null);
                  }}
                  placeholder="Promo Code (e.g. DIGI500 / SPECIAL)"
                  className="flex-1 p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscountCode}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-xs rounded-xl transition cursor-pointer border border-slate-700"
                >
                  Apply
                </button>
              </div>
              {promoMessage && (
                <p className={`text-[10px] font-mono mt-1 ${promoMessage.isError ? "text-rose-400" : "text-emerald-400 font-bold"}`}>
                  {promoMessage.text}
                </p>
              )}
            </div>

            {/* SLIP UPLOAD INPUT */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300">
                බැංකු රිසිට්පත තෝරන්න (JPG / PNG / PDF)
              </label>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, application/pdf"
                onChange={handleSlipFileSelect}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer bg-slate-950 p-2 rounded-2xl border border-slate-900"
              />

              {slipFile && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-3 flex items-center justify-center">
                  {isPdf ? (
                    <div className="flex items-center gap-3 py-2">
                      <span className="text-3xl">📄</span>
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-200 truncate max-w-[240px]">{slipFile.name}</p>
                        <p className="text-[10px] text-emerald-400 font-mono">{(slipFile.size / 1024).toFixed(1)} KB (PDF Ready)</p>
                      </div>
                    </div>
                  ) : slipPreview ? (
                    <img src={slipPreview} alt="Slip Preview" className="max-h-44 object-contain rounded-xl" />
                  ) : null}
                </div>
              )}
            </div>

            {/* SUMMARY & SUBMIT */}
            <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded-2xl flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-gray-400">Selected Plan: </span>
                <strong className="text-white font-bold">{selectedPlanDays} Days</strong>
                {appliedPromo && <span className="ml-1 text-emerald-400 font-bold">({appliedPromo})</span>}
              </div>
              <div className="text-right">
                <span className="text-gray-400 text-[10px] block">Amount to Transfer</span>
                <span className="text-emerald-400 font-black text-sm">LKR {finalPayableAmount.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleUploadBankSlip}
              disabled={!slipFile || uploading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white font-black rounded-xl text-xs transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {uploading ? "⚙️ Slip එක උඩුගත වෙමින් පවතී..." : "🚀 Slip එක Upload කර Account එක Activate කරන්න"}
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b19] flex items-center justify-center text-blue-400 text-xs font-mono">Loading Payment Portal...</div>}>
      <PayContent />
    </Suspense>
  );
}