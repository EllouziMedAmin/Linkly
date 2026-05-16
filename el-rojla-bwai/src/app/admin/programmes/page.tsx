"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Plus, Loader2 } from "lucide-react";

interface Programme {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRequirements, setNewRequirements] = useState("");
  const [newCapacity, setNewCapacity] = useState(100);
  const [newApprovalMode, setNewApprovalMode] = useState("auto");
  const [customFields, setCustomFields] = useState<{ id: string; label: string; type: string; required: boolean }[]>([]);
  const [showForm, setShowForm] = useState(false);

  const addCustomField = () => {
    setCustomFields([...customFields, { id: Math.random().toString(36).substr(2, 9), label: "", type: "text", required: false }]);
  };
  const updateCustomField = (id: string, key: string, value: any) => {
    setCustomFields(customFields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };
  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  const fetchProgrammes = async () => {
    const res = await fetch("/api/programmes");
    const data = await res.json();
    if (data.success) setProgrammes(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProgrammes();
  }, []);

  const createProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);

    const res = await fetch("/api/programmes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: newName.trim(), 
        status: "active", 
        requirements: newRequirements.trim(), 
        capacity: newCapacity,
        approval_mode: newApprovalMode,
        custom_fields: customFields
      }),
    });

    const data = await res.json();
    if (data.success) {
      setProgrammes((prev) => [data.data, ...prev]);
      setNewName("");
      setNewRequirements("");
      setNewCapacity(100);
      setNewApprovalMode("auto");
      setCustomFields([]);
      setShowForm(false);
    }
    setCreating(false);
  };

  const statusColor: Record<string, string> = {
    draft: "text-neutral-400 border-neutral-600 bg-neutral-800/50",
    active: "text-sky-500 border-sky-600/20 bg-sky-600/10",
    completed: "text-blue-400 border-blue-500/20 bg-blue-500/10",
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">
            Programmes
          </h1>
          <p className="text-neutral-400 text-sm">
            Manage accelerator and mentorship programmes.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-sky-600 hover:bg-sky-700 text-foreground font-bold rounded-xl gap-2"
        >
          <Plus className="w-4 h-4" />
          New Programme
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="glass border-sky-600/20 rounded-2xl">
          <CardContent className="pt-6">
            <form onSubmit={createProgramme} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Programme Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-foreground placeholder:text-neutral-500 focus:outline-none focus:border-sky-600/50"
                    placeholder='e.g., "KL Cleantech Accelerator 2026"'
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Capacity (Max Startups)</label>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(parseInt(e.target.value) || 100)}
                    className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-foreground placeholder:text-neutral-500 focus:outline-none focus:border-sky-600/50"
                    min={1}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Governance / Approval Flow</label>
                <select
                  value={newApprovalMode}
                  onChange={(e) => setNewApprovalMode(e.target.value)}
                  className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-sky-600/50 appearance-none"
                >
                  <option value="auto">Autonomous AI (Auto-Accept &gt;= 80, Auto-Reject &lt; 40)</option>
                  <option value="manual">Manual Admin Review (AI only suggests a score, human decides)</option>
                </select>
                <p className="text-xs text-neutral-500 mt-1">If Manual is selected, all applications will go to Pending status in your Inbox regardless of AI score.</p>
              </div>

              {/* Dynamic Form Builder */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Dynamic Application Fields</h3>
                    <p className="text-xs text-neutral-400">Add custom questions or required links (e.g., CV, GitHub, Portfolio).</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCustomField}
                    className="border-violet-500/30 text-violet-400 hover:text-foreground hover:bg-violet-500/20 gap-1 text-xs h-8 px-3"
                  >
                    <Plus className="w-3 h-3" /> Add Field
                  </Button>
                </div>
                
                {customFields.length > 0 ? (
                  <div className="space-y-3">
                    {customFields.map((field) => (
                      <div key={field.id} className="flex items-center gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateCustomField(field.id, "label", e.target.value)}
                          placeholder="e.g. GitHub Repo Link"
                          className="flex-1 bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-violet-500/50"
                          required
                        />
                        <select
                          value={field.type}
                          onChange={(e) => updateCustomField(field.id, "type", e.target.value)}
                          className="bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-violet-500/50"
                        >
                          <option value="text">Short Answer</option>
                          <option value="textarea">Long Text</option>
                          <option value="url">Link / URL</option>
                          <option value="number">Number</option>
                        </select>
                        <label className="flex items-center gap-2 text-sm text-neutral-300">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateCustomField(field.id, "required", e.target.checked)}
                            className="rounded border-neutral-700 text-violet-500 focus:ring-violet-500 focus:ring-offset-neutral-900"
                          />
                          Required
                        </label>
                        <button
                          type="button"
                          onClick={() => removeCustomField(field.id)}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-neutral-800 rounded-lg">
                    <p className="text-xs text-neutral-500">No custom fields added. Default fields (Name, Email, Pitch) will be used.</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">AI Acceptance Requirements (Optional)</label>
                <textarea
                  value={newRequirements}
                  onChange={(e) => setNewRequirements(e.target.value)}
                  className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl px-4 py-3 text-foreground placeholder:text-neutral-500 focus:outline-none focus:border-sky-600/50 resize-none"
                  placeholder='e.g., "Must be a FinTech startup. Must have an MVP. Reject if it is just an idea."'
                  rows={3}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="bg-sky-600 hover:bg-sky-700 text-foreground font-bold rounded-xl gap-2 px-6"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Programme"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Programme List */}
      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-6 h-6 text-neutral-500 animate-spin mx-auto mb-3" />
          <p className="text-neutral-400">Loading programmes...</p>
        </div>
      ) : programmes.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-neutral-700 rounded-2xl">
          <FolderKanban className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <p className="text-neutral-400 font-medium">No programmes yet</p>
          <p className="text-sm text-neutral-500 mt-1">
            Create your first programme to start managing ecosystem linkages.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {programmes.map((prog) => (
            <Card key={prog.id} className="glass border-neutral-800 rounded-2xl">
              <CardContent className="flex items-center justify-between py-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-sky-500 flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold">{prog.name}</h3>
                    <p className="text-xs text-neutral-500">
                      Created{" "}
                      {new Date(prog.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={statusColor[prog.status] || statusColor.draft}
                >
                  {prog.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
