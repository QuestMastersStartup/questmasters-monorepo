import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { RulesEngineModule } from './rules-engine/rules-engine.module';

@Module({
  imports: [SharedModule, RulesEngineModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
