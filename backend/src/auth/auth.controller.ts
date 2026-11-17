import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators.js';
import { AuthService } from './auth.service.js';
import { ConnexionDto, InscriptionDto } from './dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('inscription')
  inscrire(@Body() dto: InscriptionDto) {
    return this.auth.inscrire(dto);
  }

  @Public()
  @Post('connexion')
  @HttpCode(200)
  connecter(@Body() dto: ConnexionDto) {
    return this.auth.connecter(dto);
  }
}
