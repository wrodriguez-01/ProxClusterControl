import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, UserPlus, Search, MoreHorizontal, Shield, Key, Clock, Trash } from "lucide-react";
import { useState } from "react";

interface User {
  id: string;
  username: string;
  realm: string;
  fullName?: string;
  email?: string;
  role: string;
  permissions: string[];
  lastLogin?: string;
  enabled: boolean;
  twoFactor: boolean;
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  //todo: remove mock functionality
  const mockUsers: User[] = [
    {
      id: "1",
      username: "root",
      realm: "pam",
      fullName: "System Administrator",
      email: "admin@proxmox.local",
      role: "Administrator", 
      permissions: ["VM.Allocate", "VM.Config", "VM.Console", "VM.PowerMgmt", "Datastore.Allocate"],
      lastLogin: "2024-01-15 14:30:22",
      enabled: true,
      twoFactor: true
    },
    {
      id: "2", 
      username: "backup",
      realm: "pve",
      fullName: "Backup Service Account",
      role: "VMBackup",
      permissions: ["VM.Backup", "VM.Snapshot"],
      lastLogin: "2024-01-15 02:00:15",
      enabled: true,
      twoFactor: false
    },
    {
      id: "3",
      username: "monitor",
      realm: "pve", 
      fullName: "Monitoring User",
      email: "monitor@proxmox.local",
      role: "VMUser",
      permissions: ["VM.Monitor", "VM.Audit"],
      lastLogin: "2024-01-14 18:45:33",
      enabled: true,
      twoFactor: true
    },
    {
      id: "4",
      username: "devuser",
      realm: "pve",
      fullName: "Development User",
      email: "dev@proxmox.local", 
      role: "VMUser",
      permissions: ["VM.Console", "VM.Config"],
      lastLogin: "2024-01-13 16:22:18",
      enabled: false,
      twoFactor: false
    }
  ];

  const filteredUsers = mockUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateUser = () => {
    console.log("Create user clicked"); //todo: remove mock functionality
  };

  const handleUserAction = (action: string, userId: string) => {
    console.log(`${action} user ${userId}`); //todo: remove mock functionality
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Administrator": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "VMBackup": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "VMUser": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getInitials = (username: string, fullName?: string) => {
    if (fullName) {
      const names = fullName.split(" ");
      return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0][0];
    }
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, permissions, and access control
          </p>
        </div>
        <Button onClick={handleCreateUser} data-testid="button-create-user">
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{mockUsers.length}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {mockUsers.filter(u => u.enabled).length}
            </div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {mockUsers.filter(u => u.twoFactor).length}
            </div>
            <div className="text-sm text-muted-foreground">2FA Enabled</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {mockUsers.filter(u => u.role === "Administrator").length}
            </div>
            <div className="text-sm text-muted-foreground">Administrators</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-users"
          />
        </div>
      </div>

      {/* User List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Users ({filteredUsers.length})</h2>
        <div className="grid gap-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found matching your search.</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="hover-elevate" data-testid={`user-card-${user.username}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="text-sm font-medium">
                          {getInitials(user.username, user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold" data-testid={`user-name-${user.username}`}>
                            {user.fullName || user.username}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {user.username}@{user.realm}
                          </Badge>
                          <Badge variant="secondary" className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                          {!user.enabled && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400">
                              Disabled
                            </Badge>
                          )}
                        </div>
                        {user.email && (
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 mb-1">
                          {user.twoFactor ? (
                            <Shield className="h-3 w-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <Shield className="h-3 w-3 text-gray-400" />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {user.twoFactor ? "2FA" : "No 2FA"}
                          </span>
                        </div>
                        {user.lastLogin && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {user.lastLogin}
                            </span>
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" data-testid={`user-actions-${user.username}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUserAction("edit", user.id)}>
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction("permissions", user.id)}>
                            <Key className="mr-2 h-3 w-3" />
                            Manage Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction("2fa", user.id)}>
                            <Shield className="mr-2 h-3 w-3" />
                            Configure 2FA
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user.enabled ? "disable" : "enable", user.id)}
                          >
                            {user.enabled ? "Disable User" : "Enable User"}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleUserAction("delete", user.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash className="mr-2 h-3 w-3" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div>
                    <h4 className="font-medium text-sm mb-2">Permissions ({user.permissions.length})</h4>
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.slice(0, 5).map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                      {user.permissions.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.permissions.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}