import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Chat } from './components/Chat';
import type { Message, ImageResult } from './types';
import { Toaster } from 'sonner';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', content };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      if (!response.ok) throw new Error("에이전트 통신 오류");

      const { data } = await response.json();

      let agentImages: ImageResult[] = [];
      if (data.images && data.images.length > 0) {
        agentImages = data.images.map((img: any, i: number) => ({
          ...img,
          id: `img-${Date.now()}-${i}`
        }));
      }

      const newAgentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: data.reply || "결과를 가져왔습니다.",
        images: agentImages
      };
      setMessages((prev) => [...prev, newAgentMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: "오류가 발생했습니다. 잠시 후 다시 시도해주세요."
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Chat messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
