import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Preference } from '../preferences/entities/preference.entity';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { DynamicTool } from '@langchain/core/tools';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AgentService {
    constructor(
        @InjectRepository(Preference)
        private readonly preferenceRepo: Repository<Preference>,
        private readonly configService: ConfigService,
    ) { }

    async runAgent(userMessage: string) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        const baseUrl = 'http://localhost:3000'; // 외부 환경이면 환경변수 처리 필요
        const llm = new ChatOpenAI({ openAIApiKey: apiKey, modelName: 'gpt-4o', temperature: 0.2 });
        const embeddings = new OpenAIEmbeddings({ openAIApiKey: apiKey, modelName: 'text-embedding-3-small' });

        // 1. 유저 과거 취향 검색 툴
        const memoryRetrieverTool = new DynamicTool({
            name: 'search_past_preferences',
            description: 'Find past images the user liked based on a semantic query. Input should be a specific aesthetic or mood query.',
            func: async (query: string) => {
                try {
                    const vector = await embeddings.embedQuery(query);
                    const results = await this.preferenceRepo.query(
                        `SELECT id, category, "imageUrl", metadata, embedding <-> $1 AS distance 
             FROM preferences 
             ORDER BY embedding <-> $1 LIMIT 3`,
                        [`[${vector.join(',')}]`]
                    );

                    if (!results || results.length === 0) return 'No past preferences found.';

                    return JSON.stringify(results.map((r: any) => ({
                        id: r.id,
                        category: r.category,
                        description: r.metadata?.description,
                        imageUrl: r.imageUrl.startsWith('http') ? r.imageUrl : `${baseUrl}${r.imageUrl}`
                    })));
                } catch (e) {
                    return 'Failed to search past preferences.';
                }
            },
        });

        // 2. 외부 API 이미지 검색 툴 (Google Custom Search 연동)
        const externalSearchTool = new DynamicTool({
            name: 'search_external_images',
            description: 'Search for new images on Google matching user mood. Input: specific search keywords.',
            func: async (query: string) => {
                const googleApiKey = this.configService.get<string>('GOOGLE_API_KEY');
                const googleCseId = this.configService.get<string>('GOOGLE_CSE_ID');

                console.log('--- Google Search Tool Debug ---');
                console.log('Query:', query);
                console.log('GOOGLE_API_KEY Config:', googleApiKey ? 'LOADED' : 'MISSING');
                console.log('GOOGLE_CSE_ID Config:', googleCseId ? 'LOADED' : 'MISSING');

                if (!googleApiKey || !googleCseId || googleApiKey.includes('your_')) {
                    // Fallback to Mock if no API Keys
                    const isWoman = query.includes('woman') || query.includes('여성') || query.includes('person');
                    if (isWoman) {
                        return JSON.stringify([
                            { title: `Mock Result: ${query}`, category: 'external', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80' },
                            { title: `Mock Result: High Fashion`, category: 'external', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80' }
                        ]);
                    }
                    return 'Please configure GOOGLE_API_KEY and GOOGLE_CSE_ID for real search.';
                }

                try {
                    const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(query)}&searchType=image&num=5`;
                    const response = await fetch(url);
                    const data: any = await response.json();

                    if (!data.items) return 'No images found on Google.';

                    return JSON.stringify(data.items.map((item: any) => ({
                        title: item.title,
                        category: 'external',
                        url: item.link
                    })));
                } catch (e) {
                    return 'Failed to search Google images.';
                }
            },
        });

        const tools = [memoryRetrieverTool, externalSearchTool];

        const prompt = ChatPromptTemplate.fromMessages([
            ['system', `You are an AI visual assistant. 
            CORE LOGIC:
            1. Use 'search_past_preferences' to understand the user's specific taste, mood, and style from their history.
            2. ALWAYS use 'search_external_images' to find NEW images that match both the user's current request and their discovered taste.
            3. CRITICAL: In the final "images" array, ONLY include the new images found via 'search_external_images'. 
            4. DO NOT include past preference images in the gallery (images array). Use them only to guide your search and your conversational reply.
            
            RESPONSE FORMAT:
            {{
              "reply": "Conversational response (mentioning you've considered their past style)",
              "images": [
                {{
                  "title": "New Image Title",
                  "category": "external",
                  "url": "full url from search_external_images"
                }}
              ]
            }}`],
            ['user', '{input}'],
            new MessagesPlaceholder('agent_scratchpad'),
        ]);

        const agent = await createOpenAIToolsAgent({ llm, tools: tools as any[], prompt });
        const agentExecutor = new AgentExecutor({ agent, tools: tools as any[] });

        const response = await agentExecutor.invoke({ input: userMessage });

        // 최종 결과 출력 파싱
        let parsedResult = { reply: response.output, images: [] };

        try {
            // Find the first { and last } to extract JSON if there's surrounding text
            const firstBrace = response.output.indexOf('{');
            const lastBrace = response.output.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                const jsonStr = response.output.substring(firstBrace, lastBrace + 1);
                const rawJson = JSON.parse(jsonStr);
                parsedResult.reply = rawJson.reply || parsedResult.reply;
                parsedResult.images = rawJson.images || [];
            }
        } catch (e) {
            console.error("JSON Parse Error:", e, "Raw output:", response.output);
        }

        return parsedResult;
    }
}
