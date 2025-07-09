import { useEffect, useState, useRef, useCallback } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import type { Message } from "@ai-sdk/react";
import { TOOLS_REQURING_CONFIRMATION } from "./tools";
import { useUserManagement } from "@/hooks/useUserManagement";

// Component imports
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { Toggle } from "@/components/toggle/Toggle";
import { Textarea } from "@/components/textarea/Textarea";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { ToolInvocationCard } from "@/components/tool-invocation-card/ToolInvocationCard";
import { UserSelector } from "@/components/user-selector/UserSelector";

// Icon imports
import {
  Bug,
  Robot,
  Trash,
  PaperPlaneTilt,
  Stop,
} from "@phosphor-icons/react";

export default function Chat() {
  const [showDebug, setShowDebug] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState("auto");
  const [userSelected, setUserSelected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { currentUser } = useUserManagement();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const agent = useAgent({
    agent: "chat",
    name: `chat-${currentUser?.name || "default"}`,
  });

  agent.setState({
    userName: currentUser?.name || "Unknown User",
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

  useEffect(() => {
    if (agentMessages.length > 0) {
      scrollToBottom();
    }
  }, [agentMessages, scrollToBottom]);

  const pendingToolCallConfirmation = agentMessages.some((m: Message) =>
    m.parts?.some(
      (part) =>
        part.type === "tool-invocation" &&
        part.toolInvocation.state === "call" &&
        TOOLS_REQURING_CONFIRMATION.includes(part.toolInvocation.toolName)
    )
  );

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="h-[100vh] w-full p-4 flex justify-center items-center overflow-hidden relative"
      style={{
        backgroundImage: `url('/background1.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative z-[5] h-[calc(100vh-2rem)] h-[90%] w-[97%] mx-auto flex flex-col shadow-xl rounded-md overflow-hidden border border-neutral-300 bg-white">
        {/* Header */}
        <div className="px-4 py-3 border-b border-neutral-300 flex justify-between items-center sticky top-0 z-[5] bg-white">
          <UserSelector
            className="mr-2"
            onClick={() => setUserSelected(true)}
          />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bug size={16} className="text-black" />
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
              onClick={() => {
                clearHistory();
                window.location.reload();
              }}
            >
              <Trash size={20} className="text-black" />
            </Button>
          </div>
        </div>

<div className="flex flex-col items-center justify-center gap-4 px-6 pt-6 pb-2 bg-transparent z-[0] relative">
	            <img
              src="public/investec-logo1.png"
              alt="Investec Logo"
              className="max-w-[80%] max-h-12 object-contain select-auto pointer-events-none"
            />
            <video
              src="https://public.flourish.studio/uploads/1595817/c850041b-70a5-4267-9d7f-1092d0631bcd.mov"
              autoPlay
              muted
              loop
              playsInline
              className="max-w-[80%] max-h-64 object-contain rounded-xl shadow-none mix-blend-multiply select-auto pointer-events-none"
            />
                 </div>
        {/* Logo + Video + StripeWise Text Box */}
        {!userSelected && agentMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 px-6 pt-6 pb-2 bg-transparent z-[0] relative">

            <div className="bg-neutral-100 text-black text-base rounded-xl px-8 py-6 w-full max-w-4xl shadow-md text-center">
              <h2 className="text-2xl font-bold mb-2">StripeWise</h2>
              <p className="text-l">
                Start a conversation to spend wise. Try asking your AI financial coach:
                <br /><br />
                • Can I qualify for the Young Professionals Account if I’m employed?<br />
                • What does the R340 monthly banking fee cover, and are there any additional hidden costs?<br />
                • How do I access the complimentary life insurance, and what exactly does it cover?
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 max-h-[calc(100vh-10rem)]">
          {agentMessages.map((m: Message, index) => {
            const isUser = m.role === "user";
            const showAvatar = index === 0 || agentMessages[index - 1]?.role !== m.role;

            return (
              <div key={m.id}>
                {showDebug && (
                  <pre className="text-xs text-muted-foreground overflow-scroll">
                    {JSON.stringify(m, null, 2)}
                  </pre>
                )}
                <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-2 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    {showAvatar && !isUser ? (
                      <img
                        src="public/favicon1.jpg"
                        alt="AI"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : !isUser && <div className="w-8" />}
                    <div>
                      {m.parts?.map((part, i) => {
                        if (part.type === "text") {
                          return (
                            <div key={i}>
                              <Card
                                className={`p-3 rounded-md bg-neutral-100 ${
                                  isUser ? "rounded-br-none" : "rounded-bl-none border-assistant-border"
                                } ${part.text.startsWith("scheduled message") ? "border-accent/50" : ""} relative`}
                              >
                                {part.text.startsWith("scheduled message") && (
                                  <span className="absolute -top-3 -left-2 text-base">🕒</span>
                                )}
                                <MemoizedMarkdown
                                  id={`${m.id}-${i}`}
                                  content={part.text.replace(/^scheduled message: /, "")}
                                />
                              </Card>
                              <p className={`text-xs text-muted-foreground mt-1 ${isUser ? "text-right" : "text-left"}`}>
                                {formatTime(new Date(m.createdAt as unknown as string))}
                              </p>
                            </div>
                          );
                        }

                        if (part.type === "tool-invocation") {
                          const toolInvocation = part.toolInvocation;
                          const toolCallId = toolInvocation.toolCallId;
                          const needsConfirmation = TOOLS_REQURING_CONFIRMATION.includes(toolInvocation.toolName);

                          if (showDebug) return null;

                          return (
                            <ToolInvocationCard
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
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
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
            setTextareaHeight("auto");
          }}
          className="p-3 bg-neutral-50 absolute bottom-0 left-0 right-0 z-[5] border-t border-neutral-300 bg-white"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Textarea
                disabled={pendingToolCallConfirmation}
                placeholder={
                  pendingToolCallConfirmation
                    ? "Please respond to the tool confirmation above..."
                    : "Ask a question..."
                }
                className="flex w-full border border-neutral-200 px-3 py-2 text-base ring-offset-background placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base pb-10 bg-white"
                value={agentInput}
                onChange={(e) => {
                  handleAgentInputChange(e);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                  setTextareaHeight(`${e.target.scrollHeight}px`);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleAgentSubmit(e as unknown as React.FormEvent);
                    setTextareaHeight("auto");
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
                    className="inline-flex items-center cursor-pointer justify-center gap-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border border-neutral-200"
                    aria-label="Stop generation"
                  >
                    <Stop size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="inline-flex items-center cursor-pointer justify-center gap-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border border-neutral-200"
                    disabled={pendingToolCallConfirmation || !agentInput.trim()}
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

