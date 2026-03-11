"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

const TBC_ACCOUNT = "GE17TB7316045165100011";
const BOG_ACCOUNT = "GE49BG0000000589300342";

interface PaymentInfoModalProps {
  teamName?: string;
  /** Controlled mode: pass open + onOpenChange to control visibility */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When provided, call API on close to mark modal as shown */
  memberId?: number;
  teamId?: number;
  /** Called after modal is closed and API was called (if memberId provided) */
  onShown?: () => void;
  /** If true, hide the trigger button (for controlled/auto-show usage) */
  hideTrigger?: boolean;
}

export function PaymentInfoModal({
  teamName = "თქვენი გუნდი",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  memberId,
  teamId,
  onShown,
  hideTrigger = false,
}: PaymentInfoModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [copiedTbc, setCopiedTbc] = useState(false);
  const [copiedBog, setCopiedBog] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  async function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleOpenChange(next: boolean) {
    if (!next && memberId != null && teamId != null) {
      try {
        await fetch(`/api/teams/${teamId}/members/${memberId}/payment-modal`, {
          method: "PATCH",
        });
      } catch (_) {}
      onShown?.();
    }
    setOpen(next);
  }

  return (
    <>
      {!hideTrigger && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          გადახდის ინფორმაცია
        </Button>
      )}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>გადახდის ინფორმაცია</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p>
              თქვენ შეუერთდით გუნდს <strong>{teamName}</strong>, გისურვებთ კარგ თამაშებს და ბევრ გოლს.
            </p>
            <p>
              ჩემპიონატში მონაწილეობის საფასური არის 10 ლარი.
            </p>
            <p>
              შეგროვებული თანხით ვგეგმავთ საქველმოქმედო საქმიანობას. კერძოდ, თანხა სრულად მოხმარდება ბავშვთა სახლის ბენეფიციარების დახმარებას.
            </p>
            <p>
              ამიტომ 10 ლარი მხოლოდ სიმბოლური თანხაა — ვისაც რამდენის შესაძლებლობა აქვს, შეუძლია საკუთარი სურვილით ჩარიცხოს და მონაწილეობა მიიღოს ამ კეთილ საქმეში.
            </p>

            <div className="pt-4 border-t space-y-3">
              <p className="font-medium">საბანკო ანგარიშები:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground text-xs">TBC Bank</p>
                    <p className="font-mono text-sm break-all">{TBC_ACCOUNT}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(TBC_ACCOUNT, setCopiedTbc)}
                    className="shrink-0"
                  >
                    {copiedTbc ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    <span className="ml-1">{copiedTbc ? "კოპირებული" : "კოპირება"}</span>
                  </Button>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-muted-foreground text-xs">Bank of Georgia</p>
                    <p className="font-mono text-sm break-all">{BOG_ACCOUNT}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(BOG_ACCOUNT, setCopiedBog)}
                    className="shrink-0"
                  >
                    {copiedBog ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    <span className="ml-1">{copiedBog ? "კოპირებული" : "კოპირება"}</span>
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground text-xs mt-2">
                მიმღები: ანანო სირაძე
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
