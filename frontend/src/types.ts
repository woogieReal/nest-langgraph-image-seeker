export interface Message {
    id: string;
    role: 'user' | 'agent';
    content: string;
}

export interface ImageResult {
    id: string;
    url: string;
    title: string;
    category: string;
}
