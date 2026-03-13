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
                        imageUrl: r.imageUrl
                    })));
                } catch (e) {
                    return 'Failed to search past preferences.';
                }
            },
        });

        // 2. 외부 API 이미지 검색 툴 (Mock)
        const externalSearchTool = new DynamicTool({
            name: 'search_external_images',
            description: 'Search for new images on the internet based on user mood/category. Use this to find new images that match the user preference. Input should be a descriptive search query.',
            func: async (query: string) => {
                // Mocking an external API call like Unsplash
                return JSON.stringify([
                    { title: `External Result 1 for ${query}`, category: 'external', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&q=80' },
                    { title: `External Result 2 for ${query}`, category: 'external', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80' }
                ]);
            },
        });

        const tools = [memoryRetrieverTool, externalSearchTool];

        const prompt = ChatPromptTemplate.fromMessages([
            ['system', 'You are an AI visual assistant. When a user asks for images, you MUST use the tools available. First search their past preferences using `search_past_preferences` to understand their exact mood and style. Then, if needed or requested, use `search_external_images` to find matching new images. Finally, combine the findings and answer the user. Please return a JSON format response inside your thought process or at the end so the app can render images. Format: { "reply": "...", "images": [{ "title": "...", "category": "...", "url": "..." }] }'],
            ['user', '{input}'],
            new MessagesPlaceholder('agent_scratchpad'),
        ]);

        const agent = await createOpenAIToolsAgent({ llm, tools: tools as any[], prompt });
        const agentExecutor = new AgentExecutor({ agent, tools: tools as any[] });

        const response = await agentExecutor.invoke({ input: userMessage });

        // 최종 결과 출력 파싱 (안정성을 위해 JSON 추출)
        const jsonMatch = response.output.match(/\{[\s\S]*\}/);
        let parsedResult = { reply: response.output, images: [] };

        if (jsonMatch) {
            try {
                parsedResult = JSON.parse(jsonMatch[0]);
            } catch (e) {
                // bypass
            }
        }

        return parsedResult;
    }
}
