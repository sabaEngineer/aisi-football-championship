"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ka } from "@/lib/ka";

interface Props {
  open: boolean;
}

export function AllTeamsFullModal({ open: shouldOpen }: Props) {
  const [open, setOpen] = useState(shouldOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{ka.team.allTeamsFullTitle}</DialogTitle>
          <DialogDescription>{ka.team.allTeamsFullMessage}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
