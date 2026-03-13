import { useState } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import type { Message } from "../types";

interface ChatProps {
    messages: Message[];
    onSendMessage: (content: string) => void;
    isLoading: boolean;
}

export function Chat({ messages, onSendMessage, isLoading }: ChatProps) {
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        onSendMessage(input);
        setInput("");
    };

    return (
        <div className="flex flex-col h-1/2 border-b bg-muted/10">
            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-4">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground mt-10">
                            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>어떤 이미지를 찾고 싶으신가요?<br />"어두운 느낌의 미니멀한 건축물 사진 찾아줘" 처럼 입력해보세요.</p>
                        </div>
                    )}
                    {messages.map((m) => (
                        <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                            </div>
                            <div className={`rounded-xl p-3 max-w-[80%] ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {m.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="rounded-xl p-3 bg-muted animate-pulse w-24">
                                typing...
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 bg-background border-t">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                >
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="검색할 이미지를 설명해주세요..."
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={!input.trim() || isLoading}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
