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
                const serpApiKey = this.configService.get<string>('SERPAPI_API_KEY');

                console.log('--- SerpApi Search Tool Debug ---');
                console.log('Query:', query);
                console.log('SERPAPI_API_KEY Config:', serpApiKey ? `LOADED` : 'MISSING');

                if (!serpApiKey || serpApiKey.includes('your_')) {
                    // Fallback to Mock if no API Keys
                    const isWoman = query.includes('woman') || query.includes('여성') || query.includes('person') || query.includes('카리나') || query.includes('연예인');
                    if (isWoman) {
                        return JSON.stringify([
                            { title: `Mock Result: ${query}`, category: 'external', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80' },
                            { title: `Mock Result: High Fashion`, category: 'external', url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80' }
                        ]);
                    }
                    return 'Please configure SERPAPI_API_KEY for real search.';
                }

                try {
                    const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&api_key=${serpApiKey}`;
                    const response = await fetch(url);
                    const data: any = await response.json();

                    console.log('SerpApi Response Status:', response.status);
                    if (data.error) {
                        console.error('SerpApi Error:', data.error);
                        return `SerpApi Error: ${data.error}`;
                    }

                    const images = data.images_results || [];
                    console.log('Number of items found:', images.length);

                    if (images.length === 0) return 'No images found on Google via SerpApi.';

                    // Take up to 5 images
                    const topImages = images.slice(0, 5);

                    return JSON.stringify(topImages.map((item: any) => ({
                        title: item.title,
                        category: 'external',
                        url: item.original || item.link // Using the high res original link
                    })));
                } catch (e) {
                    console.error('Fetch Error:', e);
                    return 'Failed to search Google images via SerpApi.';
                }
            },
        });

        const tools = [memoryRetrieverTool, externalSearchTool];

        const prompt = ChatPromptTemplate.fromMessages([
            ['system', `You are an AI visual assistant. 
            CORE LOGIC:
            1. Use 'search_past_preferences' to understand the user's specific taste.
            2. Use 'search_external_images' to find NEW images matching the user request and taste.
            3. CRITICAL: Your ENTIRE response MUST be a single valid JSON object. DO NOT include any text before or after the JSON.
            4. DO NOT use markdown links in the 'reply' or anywhere else. Use the 'images' array for all images.
            
            STRICT JSON FORMAT:
            {{
              "reply": "Conversational response explaining what you found and how it fits their taste (NO MARKDOWN LINKS)",
              "images": [
                {{
                  "title": "Short Descriptive Title",
                  "category": "external",
                  "url": "full url from search_external_images result"
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
            let cleanOutput = response.output.trim();
            // Remove markdown code blocks if present
            if (cleanOutput.startsWith('```')) {
                cleanOutput = cleanOutput.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
            }

            // Find the first { and last } to extract JSON if there's surrounding text
            const firstBrace = cleanOutput.indexOf('{');
            const lastBrace = cleanOutput.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                const jsonStr = cleanOutput.substring(firstBrace, lastBrace + 1);
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
