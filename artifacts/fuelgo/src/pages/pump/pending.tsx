import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useGetMyPump } from "@workspace/api-client-react";
import { Clock, XCircle, Building2, LogOut } from "lucide-react";

export default function PumpPending() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: pump } = useGetMyPump();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const isRejected = pump?.status === "rejected";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4 ${isRejected ? "bg-destructive/10" : "bg-yellow-500/10"}`}>
            {isRejected
              ? <XCircle className="w-8 h-8 text-destructive" />
              : <Clock className="w-8 h-8 text-yellow-600" />
            }
          </div>
          <CardTitle className="text-2xl">
            {isRejected ? "Application Rejected" : "Waiting for Approval"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {isRejected
              ? "Your petrol pump application was not approved."
              : "Your application is under review by our admin team."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pump && (
            <div className="bg-muted rounded-lg p-4 text-left space-y-1">
              <p className="text-sm font-medium flex items-center gap-2"><Building2 className="w-4 h-4" /> {pump.businessName}</p>
              <p className="text-sm text-muted-foreground">{pump.address}</p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isRejected ? "bg-destructive/10 text-destructive" : "bg-yellow-100 text-yellow-700"}`}>
                  {pump.status === "pending" ? "Pending Review" : "Rejected"}
                </span>
              </div>
              {isRejected && pump.rejectionReason && (
                <p className="mt-2 text-sm text-destructive">Reason: {pump.rejectionReason}</p>
              )}
            </div>
          )}
          {!isRejected && (
            <p className="text-sm text-muted-foreground">
              We'll notify you once your application is reviewed. This usually takes 24-48 hours.
            </p>
          )}
          <Button variant="outline" className="w-full" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
