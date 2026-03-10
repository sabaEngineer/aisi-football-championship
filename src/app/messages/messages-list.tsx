"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ka } from "@/lib/ka";

interface SupportMessage {
  id: number;
  message: string;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  user: { id: number; fullName: string; email: string; phone: string };
}

export function MessagesList() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<Record<number, string>>({});

  useEffect(() => {
    fetch("/api/support")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setMessages(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleReply(id: number) {
    const text = replyText[id]?.trim();
    if (!text) return;
    setReplyingId(id);
    try {
      const res = await fetch(`/api/support/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: text }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  adminReply: data.data.adminReply,
                  repliedAt: data.data.repliedAt,
                }
              : m
          )
        );
        setReplyText((prev) => ({ ...prev, [id]: "" }));
      } else {
        alert(data.error);
      }
    } catch {
      alert(ka.match.failedToSave);
    }
    setReplyingId(null);
  }

  if (loading) {
    return <p className="text-muted-foreground">{ka.common.loading}</p>;
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">{ka.chat.noMessages}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((m) => (
        <Card key={m.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <Link href={`/players/${m.user.id}`} className="hover:underline">
                {m.user.fullName}
              </Link>
              <span className="text-xs font-normal text-muted-foreground">
                {new Date(m.createdAt).toLocaleString("ka-GE")}
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {m.user.email} · {m.user.phone}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{m.message}</p>
            {m.adminReply ? (
              <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3 text-sm border-l-2 border-green-500">
                <p className="text-xs text-muted-foreground mb-1">{ka.chat.adminReply}</p>
                <p>{m.adminReply}</p>
                {m.repliedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(m.repliedAt).toLocaleString("ka-GE")}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <textarea
                  value={replyText[m.id] ?? ""}
                  onChange={(e) =>
                    setReplyText((prev) => ({ ...prev, [m.id]: e.target.value }))
                  }
                  placeholder={ka.chat.replyPlaceholder}
                  rows={2}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                />
                <Button
                  onClick={() => handleReply(m.id)}
                  disabled={!replyText[m.id]?.trim() || replyingId === m.id}
                  size="sm"
                >
                  {replyingId === m.id ? ka.chat.replying : ka.chat.reply}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
