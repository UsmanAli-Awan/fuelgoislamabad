import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAdminListUsers, useSuspendUser, getAdminListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, User, Phone, Mail, ShieldAlert } from "lucide-react";

export default function AdminUsers() {
  const [, setLocation] = useLocation();
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
      onError: (err: any) => { toast({ title: "Error", description: err?.response?.data?.error || "Failed", variant: "destructive" }); },
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/dashboard")} data-testid="button-back"><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-bold">Users</h1>
      </div>

      <div className="flex gap-3">
        <Input placeholder="Search by name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" data-testid="input-search" />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44" data-testid="select-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="customer">Customers</SelectItem>
            <SelectItem value="pump_owner">Pump Owners</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <div className="py-8 text-center text-muted-foreground">Loading...</div>}
      {!isLoading && users.length === 0 && <div className="py-12 text-center text-muted-foreground">No users found</div>}

      <div className="space-y-3">
        {users.map(user => (
          <Card key={user.id} data-testid={`card-user-${user.id}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <p className="font-semibold">{user.fullName}</p>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${user.role === "customer" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                    {user.role === "customer" ? "Customer" : "Pump Owner"}
                  </span>
                  {user.status === "suspended" && (
                    <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-red-100 text-red-700">Suspended</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone}</p>
                {user.email && <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</p>}
                <p className="text-xs text-muted-foreground">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <Button
                size="sm"
                variant={user.status === "suspended" ? "outline" : "destructive"}
                onClick={() => handleToggleSuspend(user.id)}
                disabled={suspendMutation.isPending}
                data-testid={`button-toggle-suspend-${user.id}`}
              >
                <ShieldAlert className="w-4 h-4 mr-1" />
                {user.status === "suspended" ? "Reactivate" : "Suspend"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
