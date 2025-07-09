import { useState } from "react";
import { Robot, CaretDown, Check, Clock } from "@phosphor-icons/react";
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { APPROVAL } from "@/shared";

interface ToolInvocation {
  toolName: string;
  toolCallId: string;
  state: "call" | "result" | "partial-call";
  step?: number;
  args: Record<string, unknown>;
  result?: {
    content?: Array<{ type: string; text: string }>;
  };
}

interface ToolInvocationCardProps {
  toolInvocation: ToolInvocation;
  toolCallId: string;
  needsConfirmation: boolean;
  addToolResult: (args: { toolCallId: string; result: string }) => void;
}

export function ToolInvocationCard({
  toolInvocation,
  toolCallId,
  needsConfirmation,
  addToolResult,
}: ToolInvocationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [approvalState, setApprovalState] = useState<'pending' | 'approved' | 'rejected' | null>(null);

  const handleApproval = (approved: boolean) => {
    const result = approved ? APPROVAL.YES : APPROVAL.NO;
    setApprovalState(approved ? 'approved' : 'rejected');
    addToolResult({
      toolCallId,
      result,
    });
  };

  // Determine the current state for display purposes
  const getDisplayState = () => {
    if (needsConfirmation && toolInvocation.state === "call") {
      return approvalState || 'pending';
    }
    if (needsConfirmation && toolInvocation.state === "result") {
      return 'completed';
    }
    if (!needsConfirmation && toolInvocation.state === "result") {
      return 'completed';
    }
    return 'pending';
  };

  const displayState = getDisplayState();

  return (
    <Card
      className={`p-4 my-3 w-full max-w-[500px] rounded-md ${
        displayState === 'approved' && needsConfirmation && toolInvocation.state === 'call'
          ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
          : displayState === 'rejected'
          ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
          : "bg-neutral-100 dark:bg-neutral-900"
      } ${
        needsConfirmation && displayState === 'pending' ? "border-amber-200 dark:border-amber-800" : "border-neutral-300 dark:border-neutral-600"
      } overflow-hidden`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 cursor-pointer"
      >
        <div
          className={`${needsConfirmation ? "bg-neutral-200 dark:bg-neutral-700" : "bg-neutral-100 dark:bg-neutral-800"} p-1.5 rounded-full flex-shrink-0`}
        >
          <Robot size={16} className="text-neutral-700 dark:text-neutral-300" />
        </div>
        <h4 className="font-medium flex items-center gap-2 flex-1 text-left">
          {toolInvocation.toolName}
          {displayState === 'approved' && toolInvocation.state === 'call' && (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Check size={12} />
              Approved - Processing...
            </span>
          )}
          {displayState === 'rejected' && (
            <span className="text-xs text-red-600 dark:text-red-400">✗ Rejected</span>
          )}
          {displayState === 'completed' && (
            <span className="text-xs text-neutral-600 dark:text-neutral-400">✓ Completed</span>
          )}
          {displayState === 'pending' && needsConfirmation && toolInvocation.state === 'call' && (
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <Clock size={12} />
              Awaiting approval
            </span>
          )}
        </h4>
        <CaretDown
          size={16}
          className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`transition-all duration-200 ${isExpanded ? "max-h-[200px] opacity-100 mt-3" : "max-h-0 opacity-0 overflow-hidden"}`}
      >
        <div
          className="overflow-y-auto"
          style={{ maxHeight: isExpanded ? "180px" : "0px" }}
        >
          <div className="mb-3">
            <h5 className="text-xs font-medium mb-1 text-muted-foreground">
              Arguments:
            </h5>
            <pre className="bg-background/80 p-2 rounded-md text-xs overflow-auto whitespace-pre-wrap break-words max-w-[450px]">
              {JSON.stringify(toolInvocation.args, null, 2)}
            </pre>
          </div>

          {needsConfirmation && toolInvocation.state === "call" && displayState === 'pending' && (
            <div className="flex gap-2 justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApproval(false)}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApproval(true)}
              >
                Approve
              </Button>
            </div>
          )}

          {needsConfirmation && toolInvocation.state === "call" && displayState === 'approved' && (
            <div className="flex gap-2 justify-center">
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Check size={16} />
                <span>Tool approved, processing...</span>
              </div>
            </div>
          )}

          {needsConfirmation && toolInvocation.state === "call" && displayState === 'rejected' && (
            <div className="flex gap-2 justify-center">
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <span>✗ Tool execution rejected</span>
              </div>
            </div>
          )}

          {!needsConfirmation && toolInvocation.state === "result" && (
            <div className="mt-3 border-t border-neutral-200 dark:border-neutral-700 pt-3">
              <h5 className="text-xs font-medium mb-1 text-muted-foreground">
                Result:
              </h5>
              <pre className="bg-background/80 p-2 rounded-md text-xs overflow-auto whitespace-pre-wrap break-words max-w-[450px]">
                {(() => {
                  const result = toolInvocation.result;
                  if (typeof result === "object" && result.content) {
                    return result.content
                      .map((item: { type: string; text: string }) => {
                        if (
                          item.type === "text" &&
                          item.text.startsWith("\n~ Page URL:")
                        ) {
                          const lines = item.text.split("\n").filter(Boolean);
                          return lines
                            .map(
                              (line: string) => `- ${line.replace("\n~ ", "")}`
                            )
                            .join("\n");
                        }
                        return item.text;
                      })
                      .join("\n");
                  }
                  return JSON.stringify(result, null, 2);
                })()}
              </pre>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
