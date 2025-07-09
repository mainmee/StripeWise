import { useEffect, useState, useRef, useCallback } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import type { Message } from "@ai-sdk/react";
import { TOOLS_REQURING_CONFIRMATION } from "./tools";
import { useUserManagement } from "@/hooks/useUserManagement";

// Component imports
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { Avatar } from "@/components/avatar/Avatar";
import { Toggle } from "@/components/toggle/Toggle";
import { Textarea } from "@/components/textarea/Textarea";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { ToolInvocationCard } from "@/components/tool-invocation-card/ToolInvocationCard";
import { UserSelector } from "@/components/user-selector/UserSelector";

// Icon imports
import {
  Bug,
  Moon,
  Robot,
  Sun,
  Trash,
  PaperPlaneTilt,
  Stop,
} from "@phosphor-icons/react";

// List of tools that require human confirmation
// NOTE: this should match the keys in the executions object in tools.ts
const toolsRequiringConfirmation = TOOLS_REQURING_CONFIRMATION;

export default function Chat() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    // Check localStorage first, default to dark if not found
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as "dark" | "light") || "dark";
  });
  const [showDebug, setShowDebug] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState("auto");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the new user management system
  const { currentUser } = useUserManagement();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    // Apply theme class on mount and when theme changes
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }

    // Save theme preference to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Scroll to bottom on mount
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  const agent = useAgent({
    agent: "chat",
    name: `chat-${currentUser?.name || 'default'}`, // Use the actual user name instead of ID
  });

  // Set the state with the current user's name (technically this only needs to be done once as it is stored, but this is the easiest implementation)
  // WARNING: this overwrites the agent's entire state
  agent.setState({
    userName: currentUser?.name || "Unknown User" 
  });

  const {
    messages: agentMessages,
    input: agentInput,
    handleInputChange: handleAgentInputChange,
    handleSubmit: handleAgentSubmit,
    addToolResult,
    clearHistory,
    isLoading,
    stop,
  } = useAgentChat({
    agent,
    maxSteps: 10,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    agentMessages.length > 0 && scrollToBottom();
  }, [agentMessages, scrollToBottom]);

  const pendingToolCallConfirmation = agentMessages.some((m: Message) =>
    m.parts?.some(
      (part) =>
        part.type === "tool-invocation" &&
        part.toolInvocation.state === "call" &&
        toolsRequiringConfirmation.includes(
          part.toolInvocation.toolName
        )
    )
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-[100vh] w-full p-4 flex justify-center items-center bg-fixed overflow-hidden">
      <div className="h-[calc(100vh-2rem)] w-full mx-auto max-w-lg flex flex-col shadow-xl rounded-md overflow-hidden relative border border-neutral-300 dark:border-neutral-800">
        <div className="px-4 py-3 border-b border-neutral-300 dark:border-neutral-800 flex items-center gap-3 sticky top-0 z-10">
          <div className="flex-1">
            <h2 className="font-semibold text-base">AI Chat Agent</h2>
          </div>

          <UserSelector className="mr-2" />

          <div className="flex items-center gap-2 mr-2">
            <Bug size={16} />
            <Toggle
              toggled={showDebug}
              aria-label="Toggle debug mode"
              onClick={() => setShowDebug((prev) => !prev)}
            />
          </div>

          <Button
            variant="ghost"
            size="md"
            shape="square"
            className="rounded-full h-9 w-9"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </Button>

          <Button
            variant="ghost"
            size="md"
            shape="square"
            className="rounded-full h-9 w-9"
            onClick={() => {
              clearHistory();
              // Reload the page to immediately show the cleared chat
              window.location.reload();
            }}
          >
            <Trash size={20} />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 max-h-[calc(100vh-10rem)]">
          {agentMessages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <Card className="p-6 max-w-md mx-auto bg-neutral-100 dark:bg-neutral-900">
                <div className="text-center space-y-4">
                  <div className="bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full p-3 inline-flex">
                    <Robot size={24} />
                  </div>
                  <h3 className="font-semibold text-lg">Welcome to AI Chat</h3>
                  <p className="text-muted-foreground text-sm">
                    Start a conversation with your AI assistant. Try asking
                    about:
                  </p>
                  <ul className="text-sm text-left space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-neutral-600 dark:text-neutral-400">•</span>
                      <span>Weather information for any location</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-neutral-600 dark:text-neutral-400">•</span>
                      <span>Local time in different locations</span>
                    </li>
                  </ul>
                </div>
              </Card>
            </div>
          )}

          {agentMessages.map((m: Message, index) => {
            const isUser = m.role === "user";
            const showAvatar =
              index === 0 || agentMessages[index - 1]?.role !== m.role;

            return (
              <div key={m.id}>
                {showDebug && (
                  <pre className="text-xs text-muted-foreground overflow-scroll">
                    {JSON.stringify(m, null, 2)}
                  </pre>
                )}
                <div
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-2 max-w-[85%] ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {showAvatar && !isUser ? (
                      <Avatar username={"AI"} />
                    ) : (
                      !isUser && <div className="w-8" />
                    )}

                    <div>
                      <div>
                        {m.parts?.map((part, i) => {
                          if (part.type === "text") {
                            return (
                              // biome-ignore lint/suspicious/noArrayIndexKey: immutable index
                              <div key={i}>
                                <Card
                                  className={`p-3 rounded-md bg-neutral-100 dark:bg-neutral-900 ${
                                    isUser
                                      ? "rounded-br-none"
                                      : "rounded-bl-none border-assistant-border"
                                  } ${
                                    part.text.startsWith("scheduled message")
                                      ? "border-accent/50"
                                      : ""
                                  } relative`}
                                >
                                  {part.text.startsWith(
                                    "scheduled message"
                                  ) && (
                                    <span className="absolute -top-3 -left-2 text-base">
                                      🕒
                                    </span>
                                  )}
                                  <MemoizedMarkdown
                                    id={`${m.id}-${i}`}
                                    content={part.text.replace(
                                      /^scheduled message: /,
                                      ""
                                    )}
                                  />
                                </Card>
                                <p
                                  className={`text-xs text-muted-foreground mt-1 ${
                                    isUser ? "text-right" : "text-left"
                                  }`}
                                >
                                  {formatTime(
                                    new Date(m.createdAt as unknown as string)
                                  )}
                                </p>
                              </div>
                            );
                          }

                          if (part.type === "tool-invocation") {
                            const toolInvocation = part.toolInvocation;
                            const toolCallId = toolInvocation.toolCallId;
                            const needsConfirmation =
                              toolsRequiringConfirmation.includes(
                                toolInvocation.toolName
                              );

                            // Skip rendering the card in debug mode
                            if (showDebug) return null;

                            return (
                              <ToolInvocationCard
                                // biome-ignore lint/suspicious/noArrayIndexKey: using index is safe here as the array is static
                                key={`${toolCallId}-${i}`}
                                toolInvocation={toolInvocation}
                                toolCallId={toolCallId}
                                needsConfirmation={needsConfirmation}
                                addToolResult={addToolResult}
                              />
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAgentSubmit(e, {
              data: {
                annotations: {
                  hello: "world",
                },
              },
            });
            setTextareaHeight("auto"); // Reset height after submission
          }}
          className="p-3 bg-neutral-50 absolute bottom-0 left-0 right-0 z-10 border-t border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Textarea
                disabled={pendingToolCallConfirmation}
                placeholder={
                  pendingToolCallConfirmation
                    ? "Please respond to the tool confirmation above..."
                    : 
                    "Send a message..."
                }
                className="flex w-full border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-base ring-offset-background placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base pb-10 dark:bg-neutral-900"
                value={agentInput}
                onChange={(e) => {
                  handleAgentInputChange(e);
                  // Auto-resize the textarea
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                  setTextareaHeight(`${e.target.scrollHeight}px`);
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    handleAgentSubmit(e as unknown as React.FormEvent);
                    setTextareaHeight("auto"); // Reset height on Enter submission
                  }
                }}
                rows={2}
                style={{ height: textareaHeight }}
              />
              <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
                {isLoading ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border border-neutral-200 dark:border-neutral-800"
                    aria-label="Stop generation"
                  >
                    <Stop size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border border-neutral-200 dark:border-neutral-800"
                    disabled={pendingToolCallConfirmation || !agentInput.trim()}
                    aria-label="Send message"
                  >
                    <PaperPlaneTilt size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

