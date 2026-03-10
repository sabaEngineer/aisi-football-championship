"use client";

import { useState, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ka } from "@/lib/ka";

interface SupportMessage {
  id: number;
  message: string;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/api/support")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setMessages(d.data);
        })
        .finally(() => setLoading(false));
    }
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [data.data, ...prev]);
        setInput("");
      } else {
        alert(data.error);
      }
    } catch {
      alert(ka.match.failedToSave);
    }
    setSending(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all"
        aria-label={ka.chat.title}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{ka.chat.title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 min-h-[200px] max-h-[300px]">
              {loading ? (
                <p className="text-muted-foreground text-sm">{ka.common.loading}</p>
              ) : messages.length === 0 ? (
                <p className="text-muted-foreground text-sm">{ka.chat.noMessages}</p>
              ) : (
                <div className="space-y-4">
                  {messages.map((m) => (
                    <div key={m.id} className="space-y-2">
                      <div className="rounded-lg bg-muted/60 p-3 text-sm">
                        <p className="text-xs text-muted-foreground mb-1">{ka.chat.yourMessage}</p>
                        <p>{m.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(m.createdAt).toLocaleString("ka-GE")}
                        </p>
                      </div>
                      {m.adminReply && (
                        <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3 text-sm ml-4 border-l-2 border-green-500">
                          <p className="text-xs text-muted-foreground mb-1">{ka.chat.adminReply}</p>
                          <p>{m.adminReply}</p>
                          {m.repliedAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(m.repliedAt).toLocaleString("ka-GE")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={ka.chat.placeholder}
                rows={2}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                size="icon"
                className="shrink-0 h-10 w-10"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
