import Link from "next/link";
import { notFound } from "next/navigation";

import { CreatorProfileImage } from "@/components/creator-profile-image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPublicCreatorById } from "@/lib/services/public-dashboard";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicCreatorPage({ params }: PageProps) {
  const { id } = await params;
  const creator = await getPublicCreatorById(id);
  if (!creator) notFound();

  return (
    <div className="bg-background min-h-svh">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6">
        <Button variant="ghost" size="sm" className="-ml-2" asChild>
          <Link href="/">← Dashboard</Link>
        </Button>

        <Card>
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <div className="bg-muted text-muted-foreground flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-semibold">
              {creator.profile_image_url ? (
                <CreatorProfileImage
                  src={creator.profile_image_url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span aria-hidden>
                  {creator.name.trim().slice(0, 1).toUpperCase() || "?"}
                </span>
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-2xl leading-tight">
                {creator.name}
              </CardTitle>
              <CardDescription className="text-base">
                {creator.channel_name}
              </CardDescription>
              <p className="text-muted-foreground font-mono text-xs break-all">
                {creator.youtube_channel_id}
              </p>
            </div>
          </CardHeader>
        </Card>

        <p className="text-muted-foreground text-sm">
          Creator detail and milestones will expand here. For now, use the
          dashboard to browse all tracked creators.
        </p>
      </div>
    </div>
  );
}
