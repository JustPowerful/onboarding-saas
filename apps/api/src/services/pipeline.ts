import { ClientAssignment, Pipeline, PrismaClient } from '@saas-monorepo/database';
import { PipelinePayload } from 'src/types/pipeline.js';
import { AbstractServiceOptions } from 'src/types/services.js';

import { WorkspaceService } from './workspace.js';

export class PipelineService {
  prisma: PrismaClient;
  workspaceService: WorkspaceService;
  constructor(options: AbstractServiceOptions) {
    this.prisma = options.prisma;
    this.workspaceService = new WorkspaceService(options);
  }

  async getPipeline(pipeline_id: string) {
    return await this.prisma.pipeline.findUnique({
      where: {
        id: pipeline_id,
      },
    });
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
          default: data.default!,
          workspace_id: data.workspace_id!,
          ownerId: data.owner_id!,
          pos: pos, // dynamically set the position value
        },
      });
    } catch (error) {}
  }
  async getPipelines(workspace_id: string, user_id: string) {
    const isMember = await this.workspaceService.isWorkspaceMember(workspace_id, user_id);
    const isOwner = await this.workspaceService.isWorkspaceOwner(workspace_id, user_id);
    if (isMember || isOwner) {
      return await this.prisma.pipeline.findMany({
        where: {
          workspace_id,
        },
        include: {
          client_assignments: {
            include: {
              tasks: true,
              client: true,
            },
            orderBy: {
              pos: 'asc',
            },
          },
          allowed_users: {
            select: {
              user: {
                select: {
                  firstname: true,
                  lastname: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          pos: 'asc',
        },
      });
    } else {
      throw new Error('unauthorized');
    }
  }

  async createClientAssignment(pipeline_id: string, client_id: string, current_user_id: string) {
    const pipeline = await this.getPipeline(pipeline_id);
    if (!pipeline) throw new Error('pipeline_not_found');
    const isMember = await this.workspaceService.isWorkspaceMember(
      pipeline.workspace_id,
      current_user_id,
    );
    const isOwner = await this.workspaceService.isWorkspaceOwner(
      pipeline.workspace_id,
      current_user_id,
    );

    if (isMember || isOwner) {
      const latest = await this.prisma.clientAssignment.findFirst({
        where: {
          pipeline_id,
        },
        select: {
          pos: true,
        },
        orderBy: {
          pos: 'desc',
        },
      });
      return await this.prisma.clientAssignment.create({
        data: {
          pos: latest ? latest.pos + 1 : 0,
          pipeline_id,
          client_id,
        },
      });
    } else {
      throw new Error('unauthorized');
    }
  }

  async deletePipeline(pipeline_id: string, current_user_id: string) {
    const pipeline = await this.getPipeline(pipeline_id);
    if (!pipeline) throw new Error('pipeline_not_found');
    if (pipeline.default) throw new Error('default_pipeline_deletion_not_allowed');
    const isOwner = await this.workspaceService.isWorkspaceOwner(
      pipeline.workspace_id,
      current_user_id,
    );
    const isMember = await this.workspaceService.isWorkspaceMember(
      pipeline.workspace_id,
      current_user_id,
    );
    if (!isOwner && !isMember) throw new Error('unauthorized');
    try {
      await this.prisma.clientAssignment.deleteMany({
        where: {
          pipeline_id,
        },
      });
      await this.prisma.pipeline.delete({
        where: {
          id: pipeline_id,
        },
      });
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }

  async updatePipeline(pipeline_id: string, data: PipelinePayload, current_user_id: string) {
    const pipeline = await this.getPipeline(pipeline_id);

    if (!pipeline) throw new Error('pipeline_not_found');

    const isOwner = await this.workspaceService.isWorkspaceOwner(
      pipeline.workspace_id,
      current_user_id,
    );
    const isMember = await this.workspaceService.isWorkspaceMember(
      pipeline.workspace_id,
      current_user_id,
    );
    if (!isOwner && !isMember) throw new Error('unauthorized');
    try {
      return await this.prisma.pipeline.update({
        where: {
          id: pipeline_id,
        },
        data: {
          title: data.title,
        },
      });
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }

  async updateOrder(pipelines: any, workspace_id: string, current_user_id: string) {
    const isOwner = await this.workspaceService.isWorkspaceOwner(workspace_id, current_user_id);
    const isMember = await this.workspaceService.isWorkspaceMember(workspace_id, current_user_id);
    if (!isOwner && !isMember) throw new Error('unauthorized');

    try {
      pipelines.forEach(
        async (pipeline: Pipeline & { client_assignments: ClientAssignment[] }, index: number) => {
          // updating the pos value of each pipeline
          await this.prisma.pipeline.update({
            where: {
              id: pipeline.id,
            },
            data: {
              pos: index,
            },
          });
          //  updating the pos value of each client assignment
          const assignments = pipeline.client_assignments;
          if (assignments) {
            assignments.forEach(async (assignment, newIndex) => {
              await this.prisma.clientAssignment.update({
                where: {
                  id: assignment.id,
                },
                data: {
                  pipeline_id: pipeline.id,
                  pos: newIndex,
                },
              });
            });
          }
        },
      );
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }
}
