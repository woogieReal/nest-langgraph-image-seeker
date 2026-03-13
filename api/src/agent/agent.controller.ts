import { Controller, Post, Body } from '@nestjs/common';
import { AgentService } from './agent.service';

@Controller('agent')
export class AgentController {
    constructor(private readonly agentService: AgentService) { }

    @Post('chat')
    async chat(@Body('message') message: string) {
        if (!message) {
            return { success: false, error: '메시지가 필요합니다.' };
        }
        const result = await this.agentService.runAgent(message);
        return {
            success: true,
            data: result,
        };
    }
}
