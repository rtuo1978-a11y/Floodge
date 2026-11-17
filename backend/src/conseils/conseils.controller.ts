import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEnum, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Public } from '../common/decorators.js';
import { MomentConseil } from '../generated/prisma/enums.js';
import { IaClient } from '../integrations/ia.client.js';
import { PrismaService } from '../prisma/prisma.service.js';

class ConseilsPersoDto {
  @IsString() @MaxLength(500) situation: string;
  @IsOptional() @IsString() commune?: string;
  @IsOptional() @IsString() niveauRisque?: string;
}

class MessageDto {
  @IsIn(['user', 'assistant']) role: 'user' | 'assistant';
  @IsString() @MaxLength(2000) content: string;
}

class ChatDto {
  @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => MessageDto) messages: MessageDto[];
}

@ApiTags('conseils')
@Controller()
export class ConseilsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ia: IaClient,
  ) {}

  /** Conseils de référence (avant / pendant / après une inondation). */
  @Public()
  @Get('conseils')
  lister(@Query('moment') moment?: MomentConseil) {
    return this.prisma.conseil.findMany({
      where: { moment: moment && moment in MomentConseil ? moment : undefined },
      orderBy: [{ moment: 'asc' }, { ordre: 'asc' }],
    });
  }

  /** Conseils adaptés à la situation décrite (IA Ollama), avec repli sur les conseils de référence. */
  @ApiBearerAuth()
  @Post('conseils/personnalises')
  async personnalises(@Body() dto: ConseilsPersoDto) {
    const ia = await this.ia.conseils(dto);
    if (ia) return ia;
    const base = await this.prisma.conseil.findMany({ where: { moment: 'PENDANT' }, orderBy: { ordre: 'asc' } });
    return { conseils: base.map((c) => `${c.titre} : ${c.contenu}`), source: 'reference' };
  }

  /** Assistant conversationnel Floodge. */
  @ApiBearerAuth()
  @Post('ia/chat')
  async chat(@Body() dto: ChatDto) {
    return (
      (await this.ia.discuter(dto)) ?? {
        reponse:
          "L'assistant est momentanément indisponible. En cas de danger, mettez-vous en hauteur, " +
          "coupez l'électricité et utilisez le bouton SOS de l'application.",
        source: 'repli',
      }
    );
  }
}
