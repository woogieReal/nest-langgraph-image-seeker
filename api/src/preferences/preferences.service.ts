import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Preference } from './entities/preference.entity';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

@Injectable()
export class PreferencesService {
    constructor(
        @InjectRepository(Preference)
        private readonly preferenceRepo: Repository<Preference>,
        private readonly configService: ConfigService,
    ) { }

    async processAndSavePreference(file: Express.Multer.File, category: string) {
        try {
            // 1. 이미지 파일을 Base64로 변환
            const imageBuffer = fs.readFileSync(file.path);
            const base64Image = imageBuffer.toString('base64');
            const dataUrl = `data:${file.mimetype};base64,${base64Image}`;

            // 2. OpenAI Vision으로 이미지 분석
            const visionModel = new ChatOpenAI({
                modelName: 'gpt-4o',
                maxTokens: 300,
                openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
            });

            const message = new HumanMessage({
                content: [
                    { type: 'text', text: '이 이미지의 시각적 무드, 스타일, 주요 색상, 테마를 검색 쿼리로 쓸 수 있도록 1~2문장으로 묘사해줘. (예: 어두운 톤의 미니멀한 모던 건축물 느낌)' },
                    { type: 'image_url', image_url: { url: dataUrl } },
                ],
            });

            const visionResponse = await visionModel.invoke([message]);
            const imageDescription = visionResponse.content as string;

            // 3. 텍스트 임베딩 생성
            const embeddings = new OpenAIEmbeddings({
                openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
                modelName: 'text-embedding-3-small',
            });
            const vector = await embeddings.embedQuery(imageDescription);

            // 4. DB 저장
            const preference = this.preferenceRepo.create({
                category,
                imageUrl: `/uploads/${file.filename}`,
                metadata: {
                    description: imageDescription,
                    originalFilename: file.originalname,
                    embedding: vector // vector 컬럼 대신 일단 jsonb로 저장 (TypeORM pgvector 제약 우회)
                }
            });

            const saved = await this.preferenceRepo.save(preference);

            // 실제 pgvector 컬럼에 업데이트 (query builder 사용)
            await this.preferenceRepo.query(
                `UPDATE preferences SET embedding = $1 WHERE id = $2`,
                [`[${vector.join(',')}]`, saved.id]
            );

            return {
                id: saved.id,
                category,
                description: imageDescription,
            };
        } catch (error) {
            console.error('Error processing preference:', error);
            throw new InternalServerErrorException('이미지 분석 및 저장 중 오류가 발생했습니다.');
        }
    }
}
