import { PrismaClient } from '@saas-monorepo/database';
import { PipelinePayload } from 'src/types/pipeline.js';
import { AbstractServiceOptions } from 'src/types/services.js';

export class PipelineService {
  prisma: PrismaClient;
  constructor(options: AbstractServiceOptions) {
    this.prisma = options.prisma;
  }

  async createPipeline(data: PipelinePayload) {
    try {
      await this.prisma.pipeline.create({
        data: {
          title: data.title,
          default: data.default,
          workspace_id: data.workspace_id,
          ownerId: data.owner_id,
          pos: data.pos,
        },
      });
    } catch (error) {}
  }
}
