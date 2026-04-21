import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Workspace from "./pages/Workspace";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/workspace" component={Workspace} />
      <Route path="/workspace/:roomId" component={Workspace} />
      <Route path="/login-error">
        {(params) => {
          const search = typeof window !== "undefined" ? window.location.search : "";
          const reason = new URLSearchParams(search).get("reason") || "unknown";
          return (
            <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
              <div className="max-w-md w-full border-2 border-destructive/50 bg-destructive/10 p-8 text-center">
                <h1 className="text-2xl font-bold mb-4 uppercase tracking-tighter text-destructive">System Error</h1>
                <p className="text-sm font-mono mb-6">
                  Authentication failed: <span className="text-destructive font-bold">{reason.replace(/_/g, " ")}</span>
                </p>
                <p className="text-xs text-muted-foreground mb-8">
                  Please ensure VITE_OAUTH_PORTAL_URL and VITE_APP_ID are set in your environment variables.
                </p>
                <a href="/" className="inline-block bg-foreground text-background px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-foreground/90">
                  Return to Home
                </a>
              </div>
            </div>
          );
        }}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            toastOptions={{
              style: {
                background: "oklch(0.19 0.005 250)",
                border: "1px solid oklch(0.3 0.01 250)",
                color: "oklch(0.88 0.02 80)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
