"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { AlertDialogAction } from "@/components/ui/alert-dialog";
import { deleteMember } from "../actions";

interface DeleteMemberButtonProps {
  id: string;
}

export function DeleteMemberButton({ id }: DeleteMemberButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteMember(id);
      router.push("/members");
      router.refresh();
    } catch (error) {
      console.error("Error deleting member:", error);
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialogAction 
      onClick={(e) => {
        e.preventDefault();
        handleDelete();
      }}
      disabled={isDeleting}
      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
    >
      {isDeleting ? (
        <>
          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
          Deleting...
        </>
      ) : (
        "Delete Member"
      )}
    </AlertDialogAction>
  );
}