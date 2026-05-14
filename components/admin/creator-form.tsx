"use client";

import { useActionState } from "react";
import Link from "next/link";

import { createCreatorAction, updateCreatorAction } from "@/app/actions/creators";
import type { CreatorFormState } from "@/lib/types/creator-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: CreatorFormState = { error: null };

export type CreatorFormDefaults = {
  name: string;
  channel_name: string;
  youtube_channel_id: string;
  profile_image_url: string;
  youtube_url: string;
  twitch_url: string;
  twitter_url: string;
  is_active: boolean;
};

const emptyDefaults: CreatorFormDefaults = {
  name: "",
  channel_name: "",
  youtube_channel_id: "",
  profile_image_url: "",
  youtube_url: "",
  twitch_url: "",
  twitter_url: "",
  is_active: true,
};

type Props =
  | { mode: "create"; defaultValues?: CreatorFormDefaults }
  | { mode: "edit"; creatorId: string; defaultValues: CreatorFormDefaults };

export function CreatorForm(props: Props) {
  const defaults =
    props.mode === "create" ? (props.defaultValues ?? emptyDefaults) : props.defaultValues;

  const action =
    props.mode === "create"
      ? createCreatorAction
      : (prev: CreatorFormState, fd: FormData) =>
          updateCreatorAction(props.creatorId, prev, fd);

  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          autoComplete="off"
          defaultValue={defaults.name}
          disabled={pending}
        />
        <p className="text-muted-foreground text-xs">How you refer to this creator in the admin UI.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="channel_name">Channel name</Label>
        <Input
          id="channel_name"
          name="channel_name"
          required
          autoComplete="off"
          defaultValue={defaults.channel_name}
          disabled={pending}
        />
        <p className="text-muted-foreground text-xs">
          Public-facing channel title (e.g. as shown on YouTube).
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="youtube_channel_id">YouTube channel ID</Label>
        <Input
          id="youtube_channel_id"
          name="youtube_channel_id"
          required
          autoComplete="off"
          defaultValue={defaults.youtube_channel_id}
          disabled={pending}
        />
        <p className="text-muted-foreground text-xs">
          From the channel URL (e.g. <code className="text-foreground">UC…</code>).
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="profile_image_url">Profile image URL (optional)</Label>
        <Input
          id="profile_image_url"
          name="profile_image_url"
          type="url"
          inputMode="url"
          placeholder="https://"
          defaultValue={defaults.profile_image_url}
          disabled={pending}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="youtube_url">YouTube URL (optional)</Label>
        <Input
          id="youtube_url"
          name="youtube_url"
          type="url"
          inputMode="url"
          placeholder="https://www.youtube.com/@handle"
          defaultValue={defaults.youtube_url}
          disabled={pending}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="twitch_url">Twitch URL (optional)</Label>
        <Input
          id="twitch_url"
          name="twitch_url"
          type="url"
          inputMode="url"
          placeholder="https://www.twitch.tv/…"
          defaultValue={defaults.twitch_url ?? ""}
          disabled={pending}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="twitter_url">Twitter / X URL (optional)</Label>
        <Input
          id="twitter_url"
          name="twitter_url"
          type="url"
          inputMode="url"
          placeholder="https://x.com/…"
          defaultValue={defaults.twitter_url ?? ""}
          disabled={pending}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="is_active"
          name="is_active"
          type="checkbox"
          defaultChecked={defaults.is_active}
          disabled={pending}
          className="border-input size-4 rounded border accent-primary"
        />
        <Label htmlFor="is_active" className="font-normal">
          Active (show on public site when launched)
        </Label>
      </div>
      {state.error ? (
        <p className="text-destructive text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Saving…"
            : props.mode === "create"
              ? "Create creator"
              : "Save changes"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/creators">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
