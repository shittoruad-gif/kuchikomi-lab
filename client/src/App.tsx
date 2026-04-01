import { Route, Switch, Redirect, useLocation } from "wouter";
import { Toaster } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/Home";
import Pricing from "@/pages/Pricing";
import Trial from "@/pages/Trial";
import Dashboard from "@/pages/Dashboard";
import Generate from "@/pages/Generate";
import CustomQuestions from "@/pages/CustomQuestions";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentHistory from "@/pages/PaymentHistory";
import Admin from "@/pages/Admin";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAdmin, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!isAdmin) {
    navigate("/");
    return null;
  }

  return <Component />;
}

export default function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/trial" component={Trial} />
        <Route path="/dashboard">
          <ProtectedRoute component={Dashboard} />
        </Route>
        <Route path="/generate">
          <ProtectedRoute component={Generate} />
        </Route>
        <Route path="/custom-questions">
          <ProtectedRoute component={CustomQuestions} />
        </Route>
        <Route path="/payment/success">
          <ProtectedRoute component={PaymentSuccess} />
        </Route>
        <Route path="/payment/history">
          <ProtectedRoute component={PaymentHistory} />
        </Route>
        <Route path="/admin">
          <AdminRoute component={Admin} />
        </Route>
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
      <Toaster position="top-right" richColors />
    </>
  );
}
