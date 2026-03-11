"use client";

import { useEffect, useState, useRef } from "react";
import { PaymentInfoModal } from "./payment-info-modal";

export const STORAGE_KEY = "paymentModalPending";
export const PAYMENT_MODAL_PENDING_EVENT = "paymentModalPending";

const DELAY_MS = 10_000;

function readPending(): { memberId: number; teamName: string; teamId: number } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { memberId?: number; teamName?: string; teamId?: number };
    if (typeof parsed?.memberId === "number" && typeof parsed?.teamName === "string" && typeof parsed?.teamId === "number") {
      return { memberId: parsed.memberId, teamName: parsed.teamName, teamId: parsed.teamId };
    }
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

export function PaymentModalTrigger() {
  const [pending, setPending] = useState<{ memberId: number; teamName: string; teamId: number } | null>(null);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const p = readPending();
    if (p) setPending(p);

    const handler = () => {
      const p = readPending();
      if (p) setPending(p);
    };
    window.addEventListener(PAYMENT_MODAL_PENDING_EVENT, handler);
    return () => window.removeEventListener(PAYMENT_MODAL_PENDING_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!pending) return;
    timerRef.current = setTimeout(() => {
      setOpen(true);
    }, DELAY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pending]);

  function handleShown() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {}
    setPending(null);
    setOpen(false);
  }

  if (!pending) return null;

  return (
    <PaymentInfoModal
      teamName={pending.teamName}
      open={open}
      onOpenChange={setOpen}
      memberId={pending.memberId}
      teamId={pending.teamId}
      onShown={handleShown}
      hideTrigger
    />
  );
}
