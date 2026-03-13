import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { Preference } from '../preferences/entities/preference.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Preference])],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule { }
