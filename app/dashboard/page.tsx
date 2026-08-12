<div className="space-y-2 pt-1">
  {isClassEnded ? (
    <div className="w-full py-2.5 bg-amber-950/40 border border-amber-800/50 text-amber-400 text-[11px] font-bold rounded-xl text-center select-none flex items-center justify-center gap-1.5 shadow-inner">
      <span>⏳</span>
      <span>Class Ended / Recording Processing...</span>
    </div>
  ) : (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {rawStatus === "STARTED" ? (
          <button disabled className="py-2 bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 rounded-xl text-[10px] font-bold text-center cursor-not-allowed transition-all">
            🟢 Running...
          </button>
        ) : (
          <button 
            onClick={() => handleStartClass(item)}
            className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[10px] font-bold transition-colors text-center block text-white w-full cursor-pointer"
          >
            {t.startClassBtn}
          </button>
        )}

        <button 
          onClick={() => {
            const formattedId = formatMeetingId(item.zoom_id);
            const details = `🎓 *${teacherName} is inviting you to a scheduled Zoom meeting.* ✨\n\n📌 *Topic:* ${item.topic}\n📅 *Date:* ${item.date || (item as any)["Start Time"]?.split(" ")[0]}\n⏰ *Time:* ${classTime}\n\n🔐 *Meeting ID:* ${formattedId}\n🔑 *Passcode:* ${pass}\n\n🌐 *Join Link:* ${joinUrl}`;
            navigator.clipboard.writeText(details);
            alert(t.alertCopySuccess);
          }}
          className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold transition-colors cursor-pointer"
        >
          {t.copyDetailsBtn}
        </button>
      </div>

      {rawStatus === "SCHEDULED" && (
        <button 
          onClick={() => handleCancelClass(item.meeting_id_row, item.zoom_id)}
          className="w-full py-1.5 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/40 text-rose-400 text-[10px] font-bold rounded-xl transition-all text-center cursor-pointer"
        >
          {t.cancelClassBtn}
        </button>
      )}
    </div>
  )}
</div>