import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';
import { Preference } from './entities/preference.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Preference])],
  controllers: [PreferencesController],
  providers: [PreferencesService],
})
export class PreferencesModule { }
