import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Almost There</h1>
      <p className="text-muted-foreground text-center text-sm max-w-md">
        Stack is ready: Next.js, Tailwind CSS v4, and shadcn/ui. Replace this
        page when you start building.
      </p>
      <Button type="button">Smoke test</Button>
    </div>
  );
}
