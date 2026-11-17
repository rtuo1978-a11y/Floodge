import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const TYPES_AUTORISES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Stockage des photos de signalement.
 *  - Supabase Storage si SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis (bucket public "photos")
 *  - sinon dossier local ./uploads (développement)
 */
@Injectable()
export class StockageService {
  private readonly logger = new Logger(StockageService.name);
  private readonly supabase: SupabaseClient | null;
  private readonly bucket: string;
  private readonly urlPublique: string;

  constructor(config: ConfigService) {
    const url = config.get<string>('SUPABASE_URL');
    const cle = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.supabase = url && cle ? createClient(url, cle) : null;
    this.bucket = config.get<string>('SUPABASE_BUCKET') ?? 'photos';
    this.urlPublique = config.get<string>('PUBLIC_URL') ?? `http://localhost:${config.get('PORT') ?? 3000}`;
    if (!this.supabase) this.logger.warn('Supabase Storage non configuré : photos enregistrées dans ./uploads');
  }

  async enregistrerPhoto(fichier: { buffer: Buffer; mimetype: string; size: number }): Promise<string> {
    const ext = TYPES_AUTORISES[fichier.mimetype];
    if (!ext) throw new BadRequestException('Format accepté : JPEG, PNG ou WebP');
    if (fichier.size > 8 * 1024 * 1024) throw new BadRequestException('Photo trop lourde (8 Mo maximum)');

    const nom = `signalements/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;

    if (this.supabase) {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .upload(nom, fichier.buffer, { contentType: fichier.mimetype });
      if (error) throw new BadRequestException(`Envoi de la photo impossible : ${error.message}`);
      return this.supabase.storage.from(this.bucket).getPublicUrl(nom).data.publicUrl;
    }

    const chemin = join(process.cwd(), 'uploads', nom);
    await mkdir(join(chemin, '..'), { recursive: true });
    await writeFile(chemin, fichier.buffer);
    return `${this.urlPublique}/uploads/${nom}`;
  }
}
