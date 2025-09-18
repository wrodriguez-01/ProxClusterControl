import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Shield, Plus } from "lucide-react";
import { useState } from "react";

import { FirewallRule } from "@/pages/Network";

interface FirewallRuleModalProps {
  rule?: FirewallRule;
  mode: "create" | "edit";
  onSave: (rule: FirewallRule) => void;
  children: React.ReactNode;
}

export default function FirewallRuleModal({ rule, mode, onSave, children }: FirewallRuleModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FirewallRule>(
    rule || {
      enabled: true,
      action: "ACCEPT",
      direction: "IN",
      protocol: "tcp",
      source: "",
      destination: "",
      port: "",
      comment: "",
      node: "cluster"
    }
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.source || !formData.destination) {
      return; // Basic validation
    }

    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave(formData);
      setOpen(false);
      
      // Reset form if creating new rule
      if (mode === "create") {
        setFormData({
          enabled: true,
          action: "ACCEPT",
          direction: "IN",
          protocol: "tcp",
          source: "",
          destination: "",
          port: "",
          comment: "",
          node: "cluster"
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof FirewallRule, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const availableNodes = ["cluster", "pve-node-01", "pve-node-02", "pve-node-03"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl" data-testid="create-rule-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {mode === "create" ? "Create Firewall Rule" : "Edit Firewall Rule"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Create a new firewall rule to control network traffic"
              : "Modify the existing firewall rule settings"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rule Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enable Rule</Label>
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => updateField('enabled', checked)}
              data-testid="switch-rule-enabled"
            />
          </div>

          <Separator />

          {/* Basic Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <select
                id="action"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.action}
                onChange={(e) => updateField('action', e.target.value)}
                data-testid="select-action"
              >
                <option value="ACCEPT">ACCEPT - Allow traffic</option>
                <option value="REJECT">REJECT - Deny with response</option>
                <option value="DROP">DROP - Silently discard</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direction">Direction</Label>
              <select
                id="direction"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.direction}
                onChange={(e) => updateField('direction', e.target.value)}
                data-testid="select-direction"
              >
                <option value="IN">IN - Incoming traffic</option>
                <option value="OUT">OUT - Outgoing traffic</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="protocol">Protocol</Label>
              <select
                id="protocol"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.protocol}
                onChange={(e) => updateField('protocol', e.target.value)}
                data-testid="select-protocol"
              >
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="icmp">ICMP</option>
                <option value="all">ALL</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="node">Apply To</Label>
              <select
                id="node"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.node}
                onChange={(e) => updateField('node', e.target.value)}
                data-testid="select-node"
              >
                {availableNodes.map(node => (
                  <option key={node} value={node}>
                    {node === "cluster" ? "Entire Cluster" : node}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Separator />

          {/* Network Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium">Network Configuration</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  placeholder="0.0.0.0/0 or 192.168.1.0/24"
                  value={formData.source}
                  onChange={(e) => updateField('source', e.target.value)}
                  data-testid="input-source"
                />
                <div className="text-xs text-muted-foreground">
                  IP address, CIDR notation, or 0.0.0.0/0 for any
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  placeholder="10.0.0.0/24 or specific IP"
                  value={formData.destination}
                  onChange={(e) => updateField('destination', e.target.value)}
                  data-testid="input-destination"
                />
                <div className="text-xs text-muted-foreground">
                  Target IP address or network range
                </div>
              </div>
            </div>

            {(formData.protocol === "tcp" || formData.protocol === "udp") && (
              <div className="space-y-2">
                <Label htmlFor="port">Port(s)</Label>
                <Input
                  id="port"
                  placeholder="22, 80, 443, 8000-8080"
                  value={formData.port || ""}
                  onChange={(e) => updateField('port', e.target.value)}
                  data-testid="input-port"
                />
                <div className="text-xs text-muted-foreground">
                  Single port (22), multiple ports (22,80,443), or range (8000-8080)
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Additional Settings */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Input
              id="comment"
              placeholder="Brief description of this rule"
              value={formData.comment || ""}
              onChange={(e) => updateField('comment', e.target.value)}
              data-testid="input-comment"
            />
            <div className="text-xs text-muted-foreground">
              Optional description to help identify this rule
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-rule"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.source || !formData.destination}
              data-testid="button-save-rule"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  {mode === "create" ? <Plus className="h-3 w-3 mr-2" /> : null}
                  {mode === "create" ? "Create Rule" : "Save Changes"}
                </>
              )}
            </Button>
          </div>

          {/* Rule Preview */}
          {formData.source && formData.destination && (
            <>
              <Separator />
              <div className="bg-muted/30 p-3 rounded">
                <div className="text-sm font-medium mb-2">Rule Preview:</div>
                <div className="text-sm text-muted-foreground">
                  <span className={`font-medium ${
                    formData.action === "ACCEPT" ? "text-green-600 dark:text-green-400" :
                    formData.action === "REJECT" ? "text-yellow-600 dark:text-yellow-400" :
                    "text-red-600 dark:text-red-400"
                  }`}>
                    {formData.action}
                  </span>
                  {" "}
                  <span className="font-medium">{formData.direction}</span>
                  {" "}
                  <span className="font-medium">{formData.protocol.toUpperCase()}</span>
                  {" traffic from "}
                  <span className="font-medium">{formData.source}</span>
                  {" to "}
                  <span className="font-medium">{formData.destination}</span>
                  {formData.port && ` on port(s) ${formData.port}`}
                  {formData.comment && ` (${formData.comment})`}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}