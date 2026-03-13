import { Controller, Post, Body, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { PreferencesService } from './preferences.service';

@Controller('preferences')
export class PreferencesController {
    constructor(private readonly preferencesService: PreferencesService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req: any, file: any, cb: Function) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                cb(null, `${uniqueSuffix}${ext}`);
            }
        })
    }))
    async uploadPreference(
        @UploadedFile() file: Express.Multer.File,
        @Body('category') category: string
    ) {
        if (!file) {
            throw new BadRequestException('이미지 파일이 필요합니다.');
        }
        if (!category) {
            throw new BadRequestException('카테고리가 필요합니다.');
        }

        // 서비스 호출 (OpenAI 연동 등)
        const result = await this.preferencesService.processAndSavePreference(file, category);

        return {
            success: true,
            message: '취향 정보가 성공적으로 저장되었습니다.',
            data: result,
        };
    }
}
