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
        <div className="flex flex-col flex-1 h-full bg-background relative overflow-hidden">
            {/* Background Gradient Accents */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none" />

            {/* Messages Area - Constrained by flex-1 and min-h-0 */}
            <ScrollArea className="flex-1 min-h-0 relative">
                <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-10">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground mt-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <div className="bg-primary/5 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-primary/10">
                                <Bot className="w-12 h-12 text-primary opacity-60" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">비주얼 어시스턴트</h2>
                            <p className="text-muted-foreground/80 max-w-sm mx-auto leading-relaxed">
                                기억을 주입하거나 원하는 이미지를 설명해 주세요.<br />
                                당신의 니즈를 분석하여 이미지를 검색합니다.
                            </p>
                        </div>
                    )}

                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`flex flex-col gap-5 ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-3 duration-500`}
                        >
                            <div className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} max-w-[90%] group`}>
                                <div className={`flex items-center justify-center w-10 min-w-[40px] h-10 rounded-2xl shadow-sm border transition-colors ${m.role === 'user'
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : 'bg-card border-border text-foreground hover:border-primary/30'
                                    }`}>
                                    {m.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                                </div>
                                <div className={`rounded-3xl px-5 py-4 text-sm leading-relaxed shadow-sm ${m.role === 'user'
                                        ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                                        : 'bg-card border border-border text-foreground rounded-tl-none'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>

                            {m.images && m.images.length > 0 && (
                                <div className="w-full mt-1 ml-14 max-w-[calc(100%-3.5rem)]">
                                    <div className="bg-muted/30 rounded-[2rem] border border-border/50 p-4 backdrop-blur-sm shadow-sm">
                                        <Gallery images={m.images} />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-4 animate-in fade-in duration-300">
                            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-muted/50 border border-border animate-pulse">
                                <Bot className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="rounded-3xl p-5 bg-muted/30 border border-border w-32 flex items-center justify-center">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-duration:0.8s]" />
                                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.15s]" />
                                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.3s]" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-32" /> {/* Extra space at bottom for floating input */}
                </div>
            </ScrollArea>

            {/* Always Visible Floating Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pt-0 z-20 pointer-events-none">
                <div className="max-w-4xl mx-auto pointer-events-auto">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="relative flex items-center gap-2 bg-background/80 backdrop-blur-2xl border border-border p-2 pr-3 rounded-[2rem] shadow-[0_8px_48px_rgba(0,0,0,0.12)] ring-1 ring-black/5 transition-all focus-within:ring-primary/20 focus-within:border-primary/50"
                    >
                        <div className="flex-1 relative flex items-center">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="어떤 이미지를 찾고 싶으신가요?"
                                disabled={isLoading}
                                className="h-14 border-none bg-transparent focus-visible:ring-0 text-base pl-6 pr-4"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            size="icon"
                            className="h-11 w-11 rounded-full shadow-lg shadow-primary/20 active:scale-90 shrink-0"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </form>
                    <p className="text-[10px] text-center text-muted-foreground/50 mt-3 font-medium tracking-tight">
                        AI 기반의 비주얼 어시스턴트가 최적의 결과를 찾아드립니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
