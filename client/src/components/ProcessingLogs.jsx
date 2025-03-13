import { ScrollArea } from "@/components/ui/scroll-area";

export function ProcessingLogs({ logs }) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Processing Logs</h3>
      <ScrollArea className="h-[200px] rounded-md border p-4">
        {logs.map((log, i) => (
          <div key={i} className="py-1">
            <span className="text-sm text-muted-foreground">{log}</span>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
