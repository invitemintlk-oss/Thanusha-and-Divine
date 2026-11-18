import React, { useState } from "react";
import { Check, Copy, Link as LinkIcon, MessageSquare, Sparkles, Church, PartyPopper, Heart } from "lucide-react";
import {
  INVITATION,
  PREFIXES,
  EVENT_OPTIONS,
  type PrefixCode,
  type EventSelection,
  buildInviteLink,
  buildInviteMessage,
  cleanName,
  displayName as toDisplayName,
  eventsFor,
} from "./invitation";

interface Generated {
  prefix: PrefixCode;
  name: string;
  events: EventSelection;
  displayName: string;
  link: string;
  message: string;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy copy */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

const EVENT_ICONS: Record<EventSelection, React.ReactNode> = {
  both: <Heart className="w-4 h-4" />,
  church: <Church className="w-4 h-4" />,
  homecoming: <PartyPopper className="w-4 h-4" />,
};

export default function Admin() {
  const [prefix, setPrefix] = useState<PrefixCode>("mr");
  const [guestName, setGuestName] = useState("");
  const [events, setEvents] = useState<EventSelection>("both");
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = window.location.origin;
  const livePreviewName = toDisplayName(prefix, guestName);

  const isStale =
    !!generated &&
    (generated.prefix !== prefix || generated.name !== cleanName(guestName) || generated.events !== events);
  const canCopy = !!generated && !isStale;

  const showToast = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2000);
  };

  const handleGenerate = (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = cleanName(guestName);
    if (!name) {
      setError("Please enter a guest name.");
      return;
    }
    setError(null);
    const dn = toDisplayName(prefix, name);
    const link = buildInviteLink(baseUrl, prefix, name, events);
    setGenerated({ prefix, name, events, displayName: dn, link, message: buildInviteMessage(dn, link) });
  };

  const handleCopy = async (kind: "link" | "message") => {
    if (!generated || isStale) return;
    const ok = await copyText(kind === "link" ? generated.link : generated.message);
    showToast(ok ? (kind === "link" ? "Link copied!" : "Message copied!") : "Copy failed — please copy manually");
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] overflow-y-auto bg-[#0A0A0A] bg-[radial-gradient(circle_at_15%_10%,rgba(139,0,0,0.18),transparent_45%),radial-gradient(circle_at_85%_90%,rgba(212,175,55,0.12),transparent_45%)] px-4 py-8 md:p-12 font-sans text-[#E0E0E0]">
      <div className="max-w-3xl mx-auto bg-[#111111] p-6 md:p-12 rounded-3xl shadow-[0_0_40px_rgba(212,175,55,0.12)] border border-[#D4AF37]/30">
        <h1 className="text-4xl md:text-5xl text-center font-playball text-[#D4AF37] mb-2">
          {INVITATION.couple.groom} & {INVITATION.couple.bride}
        </h1>
        <h2 className="text-sm md:text-base text-center font-cinzel text-[#E0E0E0] mb-10 tracking-[0.3em] font-bold uppercase">
          Invitation Link Generator
        </h2>

        <form className="space-y-8" onSubmit={handleGenerate}>
          {/* Prefix + name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label htmlFor="prefix" className="block text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
                Select Prefix
              </label>
              <select
                id="prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value as PrefixCode)}
                className="w-full p-4 rounded-xl border border-[#D4AF37]/40 focus:outline-none focus:border-[#D4AF37] bg-[#1A1A1A] text-[#E0E0E0] font-medium"
              >
                {PREFIXES.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="guest" className="block text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
                Guest Name
              </label>
              <input
                id="guest"
                type="text"
                placeholder="e.g. Sanjaya"
                value={guestName}
                onChange={(e) => {
                  setGuestName(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full p-4 rounded-xl border border-[#D4AF37]/40 focus:outline-none focus:border-[#D4AF37] bg-[#1A1A1A] text-[#E0E0E0] placeholder:text-[#E0E0E0]/40 font-medium"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          </div>

          {/* Event selection */}
          <fieldset className="space-y-3">
            <legend className="block text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-2">
              Invite To
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {EVENT_OPTIONS.map((opt) => {
                const active = events === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      active
                        ? "border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                        : "border-[#D4AF37]/25 bg-[#1A1A1A] hover:border-[#D4AF37]/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="events"
                      value={opt.value}
                      checked={active}
                      onChange={() => setEvents(opt.value)}
                      className="sr-only"
                    />
                    <span className={`flex items-center gap-2 font-bold text-sm ${active ? "text-[#D4AF37]" : "text-[#E0E0E0]"}`}>
                      {EVENT_ICONS[opt.value]}
                      {opt.label}
                    </span>
                    <span className="block text-[11px] text-[#E0E0E0]/60 mt-1">{opt.hint}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Live greeting preview */}
          <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#1A1A1A] p-5 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#E0E0E0]/50 mb-2">Greeting preview</p>
            {livePreviewName ? (
              <>
                <p className="font-playball text-3xl text-[#D4AF37]">Dear {livePreviewName} ❤️</p>
                <p className="text-sm text-[#E0E0E0]/80 mt-2">
                  We cordially invite {livePreviewName} to celebrate our special day with us.
                </p>
                <p className="text-xs text-[#E0E0E0]/50 mt-3">
                  Shows: {eventsFor(events).map((ev) => `${ev.shortTitle} (${ev.dateNumeric.replace(/ /g, "")})`).join(" + ")}
                </p>
              </>
            ) : (
              <p className="text-sm italic text-[#E0E0E0]/40">Enter a guest name to see the greeting…</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#D4AF37] text-[#0A0A0A] font-bold uppercase tracking-widest text-sm rounded-xl hover:bg-[#e6c24f] transition-all shadow-[0_10px_20px_rgba(212,175,55,0.25)]"
          >
            <Sparkles className="w-5 h-5" />
            Generate Link
          </button>
        </form>

        {/* Result */}
        <div className="mt-10 pt-8 border-t border-[#D4AF37]/20 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-3">Generated Link</h3>
            {generated ? (
              <a
                href={generated.link}
                target="_blank"
                rel="noreferrer"
                className="block break-all rounded-xl border border-[#D4AF37]/30 bg-[#1A1A1A] p-4 text-sm text-[#D4AF37] underline underline-offset-4 hover:text-white"
              >
                {generated.link}
              </a>
            ) : (
              <p className="rounded-xl border border-dashed border-[#D4AF37]/25 p-4 text-sm italic text-[#E0E0E0]/40">
                Click “Generate Link” to create the personalised invitation link.
              </p>
            )}
            {isStale && (
              <p className="mt-2 text-xs text-amber-400">
                Details changed — click “Generate Link” again before copying.
              </p>
            )}
          </div>

          {generated && (
            <div>
              <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-3">Message Preview</h3>
              <div className="bg-[#1A1A1A] p-5 rounded-2xl border border-[#D4AF37]/20 whitespace-pre-wrap break-words text-sm md:text-base text-[#E0E0E0] leading-relaxed">
                {generated.message}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => handleCopy("link")}
              disabled={!canCopy}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-[#D4AF37] hover:text-[#0A0A0A] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#D4AF37]"
            >
              <LinkIcon className="w-5 h-5" />
              Copy Link Only
            </button>
            <button
              type="button"
              onClick={() => handleCopy("message")}
              disabled={!canCopy}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-[#8B0000] text-white font-bold uppercase tracking-wider text-sm rounded-xl hover:bg-[#a31515] transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MessageSquare className="w-5 h-5" />
              Copy Full Message
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {toast && (
          <div className="flex items-center gap-2 rounded-full bg-[#1A1A1A] border border-[#D4AF37]/60 px-5 py-3 text-sm text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            {toast.startsWith("Copy failed") ? <Copy className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
