import Link from "next/link";

import { CreatorForm } from "@/components/admin/creator-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminNewCreatorPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add creator</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Only <strong className="text-foreground font-medium">name</strong>,{" "}
            <strong className="text-foreground font-medium">channel name</strong>, and{" "}
            <strong className="text-foreground font-medium">YouTube channel ID</strong> are
            required. Everything else is optional.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/creators">Back to list</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Creator details</CardTitle>
          <CardDescription>
            When you enter a URL, use a full address including{" "}
            <code className="text-foreground">https://</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreatorForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
