import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type Props = {
  serviceType: "delivery" | "lab_collection";
  value: string[];                    // selected geofence ids
  onChange: (ids: string[]) => void;
  disabled?: boolean;
};

export default function GeofenceSelector({ serviceType, value, onChange, disabled }: Props) {
  const [all, setAll] = useState<any[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("geofences")
        .select("id,name,priority,is_active")
        .eq("service_type", serviceType)
        .order("priority", { ascending: false });
      if (!mounted) return;
      if (!error) setAll(data || []);
      // optional: toast on error
    })();
    return () => { mounted = false; };
  }, [serviceType]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all;
    return all.filter((g) => g.name.toLowerCase().includes(s));
  }, [q, all]);

  const toggle = (id: string) => {
    if (disabled) return;
    onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id]);
  };

  return (
    <div className="space-y-2">
      <Input
        className="w-full"
        placeholder="Search areas…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={disabled}
      />
      <div className="max-h-56 overflow-auto border rounded p-2 space-y-1">
        {filtered.map((g) => {
          const checked = value.includes(g.id);
          return (
            <div key={g.id} className="flex items-center gap-2">
              <Checkbox
                id={g.id}
                checked={checked}
                onCheckedChange={() => toggle(g.id)}
                disabled={disabled}
              />
              <Label 
                htmlFor={g.id} 
                className="flex-1 cursor-pointer text-sm"
              >
                <div className="font-medium">{g.name}</div>
                <div className="text-xs text-muted-foreground">
                  Priority {g.priority}{g.is_active ? "" : " • inactive"}
                </div>
              </Label>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-sm text-muted-foreground">No areas found</div>
        )}
      </div>
    </div>
  );
}