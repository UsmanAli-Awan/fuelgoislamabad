import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminListUsers, useSuspendUser, getAdminListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { User, Phone, Mail, ShieldAlert, ShieldCheck, Search, Users } from "lucide-react";

const ROLE_FILTERS = ["all", "customer", "pump_owner"];

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const params = {
    ...(roleFilter !== "all" ? { role: roleFilter } : {}),
    ...(search ? { search } : {}),
  };

  const { data: users = [], isLoading } = useAdminListUsers(params, { query: { queryKey: getAdminListUsersQueryKey(params) } });
  const suspendMutation = useSuspendUser();

  const handleToggleSuspend = (id: number) => {
    suspendMutation.mutate({ id }, {
      onSuccess: (updated) => {
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        toast({ title: updated.status === "suspended" ? "User Suspended" : "User Reactivated" });
      },
      onError: (err: any) => toast({ title: "Error", description: err?.data?.error || "Failed", variant: "destructive" }),
    });
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black">Users</h1>
        <p className="text-muted-foreground text-sm">{users.length} users found</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 h-11 rounded-xl"
          placeholder="Search name, phone, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="input-search"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {ROLE_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setRoleFilter(f)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              roleFilter === f
                ? "bg-primary text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            data-testid={`filter-${f}`}
          >
            {f === "all" ? "All" : f === "customer" ? "Customers" : "Pump Owners"}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      )}

      {!isLoading && users.length === 0 && (
        <div className="py-16 text-center space-y-2">
          <Users className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground text-sm">No users found</p>
        </div>
      )}

      <div className="space-y-2">
        {users.map(user => (
          <Card key={user.id} className="border-0 shadow-sm rounded-2xl" data-testid={`card-user-${user.id}`}>
            <CardContent className="p-3.5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                user.role === "customer" ? "bg-blue-100" : "bg-purple-100"
              }`}>
                <User className={`w-5 h-5 ${user.role === "customer" ? "text-blue-600" : "text-purple-600"}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm truncate">{user.fullName}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    user.role === "customer" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                  }`}>
                    {user.role === "customer" ? "Customer" : "Pump Owner"}
                  </span>
                  {user.status === "suspended" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-700">Suspended</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3" />{user.phone}
                </p>
                {user.email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />{user.email}
                  </p>
                )}
              </div>

              <Button
                size="icon"
                variant={user.status === "suspended" ? "outline" : "ghost"}
                className={`h-9 w-9 rounded-xl shrink-0 ${user.status === "suspended" ? "border-green-200 text-green-700 hover:bg-green-50" : "text-red-500 hover:bg-red-50 hover:text-red-600"}`}
                onClick={() => handleToggleSuspend(user.id)}
                disabled={suspendMutation.isPending}
                title={user.status === "suspended" ? "Reactivate" : "Suspend"}
                data-testid={`button-toggle-suspend-${user.id}`}
              >
                {user.status === "suspended" ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
