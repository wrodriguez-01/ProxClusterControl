import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Save, X } from "lucide-react";
import { useState, useEffect } from "react";

export interface ProxmoxScript {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  type: "LXC" | "VM" | "ADDON" | "HOST";
  port?: number;
  updateable: boolean;
  privileged: boolean;
  website?: string;
  logo?: string;
  command: string;
  dateAdded: string;
  author?: string;
  isCustom?: boolean;
  defaultCredentials?: {
    username?: string;
    password?: string;
  };
  notes?: string[];
}

interface ScriptEditModalProps {
  script?: ProxmoxScript;
  isOpen: boolean;
  onClose: () => void;
  onSave: (script: ProxmoxScript) => void;
  children?: React.ReactNode;
}

const scriptCategories = [
  "Dashboards & Frontends",
  "Containers & Docker", 
  "IoT & Smart Home",
  "Proxmox & Virtualization",
  "Network & Firewall",
  "Authentication & Security",
  "Databases",
  "Monitoring & Analytics",
  "Files & Downloads",
  "Media & Streaming",
  "Automation & Scheduling",
  "Development Tools",
  "Backup & Storage",
  "Communication",
  "Miscellaneous"
];

const scriptTypes = ["LXC", "VM", "ADDON", "HOST"] as const;

export default function ScriptEditModal({ script, isOpen, onClose, onSave, children }: ScriptEditModalProps) {
  const [formData, setFormData] = useState<Partial<ProxmoxScript>>({
    name: "",
    description: "",
    category: "Miscellaneous",
    type: "LXC",
    updateable: true,
    privileged: false,
    command: "",
    website: "",
    author: "",
    notes: [],
    defaultCredentials: {}
  });

  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!script;

  useEffect(() => {
    if (script) {
      setFormData(script);
    } else {
      setFormData({
        name: "",
        description: "",
        category: "Miscellaneous", 
        type: "LXC",
        updateable: true,
        privileged: false,
        command: "",
        website: "",
        author: "",
        notes: [],
        defaultCredentials: {}
      });
    }
  }, [script, isOpen]);

  const handleSave = async () => {
    if (!formData.name || !formData.command) return;

    setIsSubmitting(true);
    
    try {
      const scriptToSave: ProxmoxScript = {
        id: script?.id || formData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: formData.name!,
        slug: formData.name!.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: formData.description || "",
        category: formData.category || "Miscellaneous",
        type: formData.type as ProxmoxScript['type'] || "LXC",
        port: formData.port,
        updateable: formData.updateable ?? true,
        privileged: formData.privileged ?? false,
        website: formData.website || "",
        command: formData.command!,
        dateAdded: script?.dateAdded || new Date().toISOString().split('T')[0],
        author: formData.author || "",
        isCustom: true,
        notes: formData.notes || [],
        defaultCredentials: formData.defaultCredentials || {}
      };

      await onSave(scriptToSave);
      onClose();
    } catch (error) {
      console.error('Failed to save script:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addNote = () => {
    if (newNote.trim()) {
      setFormData(prev => ({
        ...prev,
        notes: [...(prev.notes || []), newNote.trim()]
      }));
      setNewNote("");
    }
  };

  const removeNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="script-edit-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {isEditMode ? 'Edit Script' : 'Add New Script'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modify the script details below' : 'Create a new custom Proxmox script'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="script-name">Script Name *</Label>
              <Input
                id="script-name"
                placeholder="My Custom Script"
                value={formData.name || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-script-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="script-author">Author</Label>
              <Input
                id="script-author"
                placeholder="Your Name"
                value={formData.author || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                data-testid="input-script-author"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="script-description">Description</Label>
            <Textarea
              id="script-description"
              placeholder="Describe what this script does..."
              value={formData.description || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              data-testid="textarea-script-description"
            />
          </div>

          {/* Category and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="script-category">Category</Label>
              <select
                id="script-category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.category || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                data-testid="select-script-category"
              >
                {scriptCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="script-type">Type</Label>
              <select
                id="script-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.type || "LXC"}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ProxmoxScript['type'] }))}
                data-testid="select-script-type"
              >
                {scriptTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Command */}
          <div className="space-y-2">
            <Label htmlFor="script-command">Installation Command *</Label>
            <Textarea
              id="script-command"
              placeholder='bash -c "$(curl -fsSL https://raw.githubusercontent.com/user/repo/main/install.sh)"'
              value={formData.command || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
              rows={3}
              className="font-mono text-sm"
              data-testid="textarea-script-command"
            />
          </div>

          {/* Additional Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="script-website">Website (Optional)</Label>
              <Input
                id="script-website"
                placeholder="https://example.com"
                value={formData.website || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                data-testid="input-script-website"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="script-port">Port (Optional)</Label>
              <Input
                id="script-port"
                type="number"
                placeholder="8080"
                value={formData.port || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value ? parseInt(e.target.value) : undefined }))}
                data-testid="input-script-port"
              />
            </div>
          </div>

          {/* Switches */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="updateable"
                checked={formData.updateable ?? true}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, updateable: checked }))}
                data-testid="switch-updateable"
              />
              <Label htmlFor="updateable" className="text-sm">Updateable</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="privileged"
                checked={formData.privileged ?? false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, privileged: checked }))}
                data-testid="switch-privileged"
              />
              <Label htmlFor="privileged" className="text-sm">Requires Privileged Mode</Label>
            </div>
          </div>

          {/* Default Credentials */}
          <div className="space-y-4">
            <Label>Default Credentials (Optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default-username">Username</Label>
                <Input
                  id="default-username"
                  placeholder="admin"
                  value={formData.defaultCredentials?.username || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    defaultCredentials: { 
                      ...prev.defaultCredentials, 
                      username: e.target.value 
                    } 
                  }))}
                  data-testid="input-default-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-password">Password</Label>
                <Input
                  id="default-password"
                  placeholder="password123"
                  value={formData.defaultCredentials?.password || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    defaultCredentials: { 
                      ...prev.defaultCredentials, 
                      password: e.target.value 
                    } 
                  }))}
                  data-testid="input-default-password"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <Label>Notes</Label>
            
            {formData.notes && formData.notes.length > 0 && (
              <div className="space-y-2">
                {formData.notes.map((note, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                    <span className="flex-1 text-sm">• {note}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeNote(index)}
                      data-testid={`button-remove-note-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <Input
                placeholder="Add a note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addNote()}
                data-testid="input-new-note"
              />
              <Button onClick={addNote} size="sm" data-testid="button-add-note">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name || !formData.command || isSubmitting}
            data-testid="button-save-script"
          >
            {isSubmitting ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-3 w-3 mr-2" />
                {isEditMode ? 'Update Script' : 'Add Script'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}