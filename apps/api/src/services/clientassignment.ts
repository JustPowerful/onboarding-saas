import { PrismaClient } from '@saas-monorepo/database';
import { AbstractServiceOptions } from 'src/types/services.js';

import { PipelineService } from './pipeline.js';
import { WorkspaceService } from './workspace.js';

export class ClientAssignmentService {
  prisma: PrismaClient;
  pipelineService: PipelineService;
  workspaceService: WorkspaceService;
  constructor(options: AbstractServiceOptions) {
    this.prisma = options.prisma;
    this.pipelineService = new PipelineService(options);
    this.workspaceService = new WorkspaceService(options);
  }
  async getWorkspaceId(client_assignment_id: string) {
    const client_assignment = await this.prisma.clientAssignment.findUnique({
      where: {
        id: client_assignment_id,
      },
      select: {
        pipline: {
          select: { workspace_id: true },
        },
      },
    });
    if (!client_assignment) throw new Error('client_assignment_not_found');
    return client_assignment.pipline.workspace_id;
  }

  async createClientAssignment(pipeline_id: string, client_id: string, current_user_id: string) {
    const pipeline = await this.pipelineService.getPipeline(pipeline_id);
    if (!pipeline) throw new Error('pipeline_not_found');
    const isMember = await this.workspaceService.isWorkspaceMember(
      pipeline.workspace_id,
      current_user_id,
    );
    const isOwner = await this.workspaceService.isWorkspaceOwner(
      pipeline.workspace_id,
      current_user_id,
    );

    const isAllowed = this.workspaceService.hasPermission(
      pipeline.workspace_id,
      current_user_id,
      'EDIT',
    );
    if (!isAllowed) throw new Error('unauthorized');

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
  async removeClientAssignment(client_assignment_id: string, current_user_id: string) {
    try {
      const workspace_id = await this.getWorkspaceId(client_assignment_id);
      const isMember = await this.workspaceService.isWorkspaceMember(workspace_id, current_user_id);
      const isOwner = await this.workspaceService.isWorkspaceOwner(workspace_id, current_user_id);
      if (!isMember && !isOwner) throw new Error('unauthorized');

      const isAllowed = this.workspaceService.hasPermission(workspace_id, current_user_id, 'EDIT');
      if (!isAllowed) throw new Error('unauthorized');

      await this.prisma.clientAssignment.delete({
        where: {
          id: client_assignment_id,
        },
      });
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }
  async updateClientAssignment(
    client_assignment_id: string,
    data: { deadline: Date },
    current_user_id: string,
  ) {
    const workspace = await this.getWorkspaceId(client_assignment_id);
    if (!workspace) throw new Error('workspace_not_found');
    const isMember = await this.workspaceService.isWorkspaceMember(workspace, current_user_id);
    const isOwner = await this.workspaceService.isWorkspaceOwner(workspace, current_user_id);
    if (!isMember && !isOwner) throw new Error('unauthorized');

    const isAllowed = this.workspaceService.hasPermission(workspace, current_user_id, 'EDIT');
    if (!isAllowed) throw new Error('unauthorized');

    try {
      const client_assignment = await this.prisma.clientAssignment.findUnique({
        where: {
          id: client_assignment_id,
        },
      });
      if (!client_assignment) throw new Error('client_assignment_not_found');
      await this.prisma.clientAssignment.update({
        where: {
          id: client_assignment_id,
        },
        data: {
          deadline: data.deadline || client_assignment.deadline || null,
        },
      });
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }

  async addMember(client_assignment_id: string, user_id: string, current_user_id: string) {
    try {
      const workspace_id = await this.getWorkspaceId(client_assignment_id);
      const isMember = await this.workspaceService.isWorkspaceMember(workspace_id, current_user_id);
      const isOwner = await this.workspaceService.isWorkspaceOwner(workspace_id, current_user_id);
      if (!isMember && !isOwner) throw new Error('unauthorized');

      const isAllowed = this.workspaceService.hasPermission(workspace_id, current_user_id, 'EDIT');
      if (!isAllowed) throw new Error('unauthorized');

      const member = await this.prisma.userOnClientAssignment.create({
        data: {
          client_assignment_id,
          user_id,
        },
      });
      return member;
    } catch (error) {
      throw error;
    }
  }

  async removeMember(client_assignment_id: string, user_id: string, current_user_id: string) {
    try {
      const workspace_id = await this.getWorkspaceId(client_assignment_id);
      const isMember = await this.workspaceService.isWorkspaceMember(workspace_id, current_user_id);
      const isOwner = await this.workspaceService.isWorkspaceOwner(workspace_id, current_user_id);
      if (!isMember && !isOwner) throw new Error('unauthorized');

      const isAllowed = this.workspaceService.hasPermission(workspace_id, current_user_id, 'EDIT');
      if (!isAllowed) throw new Error('unauthorized');

      await this.prisma.userOnClientAssignment.deleteMany({
        where: {
          user_id: user_id,
          client_assignment_id: client_assignment_id,
        },
      });
    } catch (error) {
      // throw error;
      throw new Error('internal_server_error');
    }
  }

  async getUnassignedMembers(
    client_assignment_id: string,
    search: string,
    current_user_id: string,
  ) {
    try {
      const workspace_id = await this.getWorkspaceId(client_assignment_id);
      const isMember = await this.workspaceService.isWorkspaceMember(workspace_id, current_user_id);
      const isOwner = await this.workspaceService.isWorkspaceOwner(workspace_id, current_user_id);
      if (!isMember && !isOwner) throw new Error('unauthorized');
      let searchCondition = {};
      if (search) {
        searchCondition = {
          OR: [
            {
              firstname: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              lastname: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        };
      }
      const members = await this.prisma.user.findMany({
        where: {
          ...searchCondition,
          workspaces: {
            some: {
              workspace_id: workspace_id,
            },
          },
          user_on_client_assignments: {
            none: {
              client_assignment_id: client_assignment_id,
            },
          },
        },
      });
      return members;
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }
  async getAssignedMembers(client_assignment_id: string, search: string, current_user_id: string) {
    try {
      const workspace_id = await this.getWorkspaceId(client_assignment_id);
      const isOwner = await this.workspaceService.isWorkspaceOwner(workspace_id, current_user_id);
      const isMember = await this.workspaceService.isWorkspaceMember(workspace_id, current_user_id);
      if (!isOwner && !isMember) throw new Error('unauthorized');
      let searchCondition = {};
      if (search) {
        searchCondition = {
          OR: [
            {
              firstname: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              lastname: {
                contains: search,
                mode: 'insensitive',
              },
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        };
      }
      const members = await this.prisma.user.findMany({
        where: {
          ...searchCondition,
          user_on_client_assignments: {
            some: {
              client_assignment_id: client_assignment_id,
            },
          },
        },
      });
      return members;
    } catch (error) {}
  }
}
