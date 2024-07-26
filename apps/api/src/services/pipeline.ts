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
      // get the highest pos value
      const latestPipeline = await this.prisma.pipeline.findFirst({
        where: {
          workspace_id: data.workspace_id,
        },
        select: {
          pos: true,
        },
        orderBy: {
          pos: 'desc',
        },
      });
      const pos = latestPipeline ? latestPipeline.pos + 1 : 0; // if there is no pipeline, set the pos to 0

      return await this.prisma.pipeline.create({
        data: {
          title: data.title,
          default: data.default,
          workspace_id: data.workspace_id,
          ownerId: data.owner_id,
          pos: pos, // dynamically set the position value
        },
      });
    } catch (error) {}
  }
}
