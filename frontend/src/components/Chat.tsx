import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Gallery } from "./Gallery";
import type { Message } from "../types";

interface ChatProps {
    messages: Message[];
    onSendMessage: (content: string) => void;
    isLoading: boolean;
}

export function Chat({ messages, onSendMessage, isLoading }: ChatProps) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput("");
    };

    return (
        <div className="flex flex-col flex-1 h-full bg-muted/5 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <ScrollArea className="flex-1 p-6 relative">
                <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-10">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground mt-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="bg-primary/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <Bot className="w-10 h-10 text-primary opacity-80" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">무엇을 찾아드릴까요?</h3>
                            <p className="text-sm leading-relaxed">
                                "어두운 느낌의 미니멀한 건축물 사진 찾아줘"<br />
                                처럼 입력하시면 당신의 취향을 반영해 검색해 드립니다.
                            </p>
                        </div>
                    )}
                    {messages.map((m) => (
                        <div key={m.id} className={`flex flex-col gap-4 ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''} max-w-[85%]`}>
                                <div className={`flex items-center justify-center w-9 h-9 rounded-2xl shadow-sm shrink-0 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white dark:bg-zinc-800 border'}`}>
                                    {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                </div>
                                <div className={`rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                    ? 'bg-primary text-primary-foreground font-medium'
                                    : 'bg-white dark:bg-zinc-900 border text-foreground'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>

                            {m.images && m.images.length > 0 && (
                                <div className="w-full mt-2 pl-12">
                                    <div className="bg-white/50 dark:bg-zinc-900/50 rounded-2xl border p-2 backdrop-blur-sm">
                                        <Gallery images={m.images} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-4 animate-pulse">
                            <div className="flex items-center justify-center w-9 h-9 rounded-2xl bg-muted shrink-0">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="rounded-2xl p-4 bg-muted w-32 h-12 flex items-center justify-start">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
                                    <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            <div className="p-6 bg-background/80 backdrop-blur-md border-t relative z-10">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-3 max-w-4xl mx-auto"
                >
                    <div className="relative flex-1 group">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="이미지의 느낌이나 주제를 설명해주세요..."
                            disabled={isLoading}
                            className="h-12 pl-4 pr-12 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-all rounded-xl shadow-inner group-focus-within:ring-2 group-focus-within:ring-primary/20"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                                <span className="text-xs">↵</span>
                            </kbd>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        size="icon"
                        className="h-12 w-12 rounded-xl shadow-md shadow-primary/20 active:scale-95 transition-transform shrink-0"
                    >
                        <Send className="w-5 h-5 mx-auto" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
