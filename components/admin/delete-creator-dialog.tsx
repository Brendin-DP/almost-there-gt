"use client";

import { useState } from "react";

import { deleteCreatorAction } from "@/app/actions/creators";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  creatorId: string;
  creatorName: string;
};

export function DeleteCreatorDialog({ creatorId, creatorName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Delete…
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete creator</DialogTitle>
            <DialogDescription>
              This removes <strong>{creatorName}</strong> and any snapshots and
              milestones for them from the mock database. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <form action={deleteCreatorAction}>
            <input type="hidden" name="id" value={creatorId} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Delete
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
