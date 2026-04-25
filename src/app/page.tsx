import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-2">PlanGraph</h1>
      <p className="text-muted-foreground text-lg mb-8">Your project planning companion</p>
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <p className="text-center text-sm text-muted-foreground">
            Setup complete. Onboarding will appear here in Session 5.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
