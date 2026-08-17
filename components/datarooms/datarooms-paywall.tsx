"use client"

import { FolderLock } from "lucide-react"
import Link from "next/link"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

// Deliberately has no close affordance and no onOpenChange: the page behind it
// renders no dataroom data, so dismissing the dialog would only expose an empty
// shell. Leaving is done through the two links below.
export function DataroomsPaywall({ isOwner }: { isOwner: boolean }) {
  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <FolderLock className="mb-1 size-7 text-muted-foreground" />
          <AlertDialogTitle>Les datarooms font partie du plan Pro</AlertDialogTitle>
          <AlertDialogDescription>
            Regroupe plusieurs documents dans une collection partageable avec un seul lien. Passe au plan Pro pour
            débloquer les datarooms illimitées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {isOwner ? (
            <Button asChild className="w-full">
              <Link href="/settings/billing">Passer à Pro</Link>
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Demande au propriétaire de l&apos;organisation de passer au plan Pro.
            </p>
          )}
          <Button asChild variant="ghost" className="w-full">
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
