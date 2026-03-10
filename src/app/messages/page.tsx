import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ka } from "@/lib/ka";
import { MessagesList } from "./messages-list";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{ka.nav.messages}</h1>
        <p className="text-muted-foreground mt-1">
          შეტყობინებები მომხმარებლებისგან
        </p>
      </div>
      <MessagesList />
    </div>
  );
}
