import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, ExternalLink, Search } from "lucide-react";
import { ka, getPositionLabel } from "@/lib/ka";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await getSession();
  if (session?.role !== "ADMIN") notFound();

  const { search } = await searchParams;
  const searchTerm = (search ?? "").trim();

  const users = await prisma.user.findMany({
    where: searchTerm
      ? {
          OR: [
            { fullName: { contains: searchTerm, mode: "insensitive" } },
            { phone: { contains: searchTerm } },
          ],
        }
      : undefined,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      socialMediaLink: true,
      role: true,
      position: true,
      createdAt: true,
    },
    orderBy: { fullName: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-green-700 px-6 py-8">
        <div className="flex items-center gap-3">
          <Users className="h-10 w-10 text-white/90" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {ka.users.title}
            </h1>
            <p className="text-white/80 mt-1">{ka.users.subtitle}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>{ka.users.allUsers}</CardTitle>
            <form method="GET" action="/users" className="flex gap-2">
              <Input
                name="search"
                type="search"
                placeholder={ka.users.searchPlaceholder}
                defaultValue={searchTerm}
                className="min-w-[200px] sm:min-w-[280px]"
              />
              <Button type="submit" variant="secondary" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-sm">{ka.users.noUsers}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{ka.users.fullName}</TableHead>
                    <TableHead>{ka.users.email}</TableHead>
                    <TableHead>{ka.users.phone}</TableHead>
                    <TableHead>{ka.users.socialProfile}</TableHead>
                    <TableHead>{ka.users.role}</TableHead>
                    <TableHead>{ka.users.position}</TableHead>
                    <TableHead>{ka.users.registered}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <a
                          href={`mailto:${u.email}`}
                          className="hover:underline"
                        >
                          {u.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`tel:${u.phone}`}
                          className="text-muted-foreground hover:underline"
                        >
                          {u.phone}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {u.socialMediaLink ? (
                          <a
                            href={u.socialMediaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline truncate"
                            title={u.socialMediaLink}
                          >
                            <span className="truncate">{u.socialMediaLink}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {ka.common.personTypes[u.role as keyof typeof ka.common.personTypes] ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.position ? getPositionLabel(u.position) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.createdAt).toLocaleDateString("ka-GE")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
