import Link from "next/link";
import { notFound } from "next/navigation";

import { CreatorForm } from "@/components/admin/creator-form";
import { DeleteCreatorDialog } from "@/components/admin/delete-creator-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCreatorById } from "@/lib/services/creators";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditCreatorPage({ params }: Props) {
  const { id } = await params;
  const creator = await getCreatorById(id);
  if (!creator) notFound();

  const defaultValues = {
    name: creator.name,
    channel_name: creator.channel_name,
    youtube_channel_id: creator.youtube_channel_id,
    profile_image_url: creator.profile_image_url ?? "",
    youtube_url: creator.youtube_url ?? "",
    twitch_url: creator.twitch_url ?? "",
    twitter_url: creator.twitter_url ?? "",
    is_active: creator.is_active,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit creator</h1>
          <p className="text-muted-foreground mt-1 text-sm">{creator.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DeleteCreatorDialog
            creatorId={creator.id}
            creatorName={creator.name}
          />
          <Button variant="outline" asChild>
            <Link href="/admin/creators">Back to list</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Creator details</CardTitle>
          <CardDescription>
            Name, channel name, and YouTube channel ID are required. URLs are optional
            unless filled — then they must be valid.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreatorForm
            mode="edit"
            creatorId={creator.id}
            defaultValues={defaultValues}
          />
        </CardContent>
      </Card>
    </div>
  );
}
