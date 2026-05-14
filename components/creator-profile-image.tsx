import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt?: string;
  className?: string;
};

/**
 * YouTube / Google-hosted avatars (e.g. yt3.ggpht.com) often return errors when
 * the browser sends a cross-site Referer. Strip it for reliable loading.
 */
export function CreatorProfileImage({ src, alt = "", className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn(className)}
      referrerPolicy="no-referrer"
    />
  );
}
