import { PrismaClient } from '@saas-monorepo/database';
import { ClientPayload } from 'src/types/client.js';
import { AbstractServiceOptions } from 'src/types/services.js';

import { WorkspaceService } from './workspace.js';

export class ClientService {
  prisma: PrismaClient;
  workspaceService: WorkspaceService;

  constructor(options: AbstractServiceOptions) {
    this.prisma = options.prisma;
    this.workspaceService = new WorkspaceService(options);
  }

  async getUnassignedClients(workspace_id: string, current_user_id: string, search?: string) {
    const isOwner = await this.workspaceService.isWorkspaceOwner(workspace_id, current_user_id);
    const isMember = await this.workspaceService.isWorkspaceMember(workspace_id, current_user_id);
    if (!isOwner && !isMember) {
      throw new Error('unauthorized');
    }
    try {
      let searchCondition = {};
      if (search) {
        searchCondition = {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        };
      }
      return await this.prisma.client.findMany({
        where: {
          ...searchCondition,
          workspaceId: workspace_id,
          assignments: {
            none: {},
          },
        },

        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          create_at: true,
          updated_at: true,
        },
      });
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }

  async getClients(workspace_id: string, current_user_id: string) {
    const isOwner = await this.workspaceService.isWorkspaceOwner(workspace_id, current_user_id);
    const isMember = await this.workspaceService.isWorkspaceMember(workspace_id, current_user_id);
    if (!isOwner && !isMember) {
      throw new Error('unauthorized');
    }

    try {
      return await this.prisma.client.findMany({
        where: {
          workspaceId: workspace_id,
        },
        include: {
          assignments: {
            select: {
              id: true,
              pipline: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }

  async createClient(data: ClientPayload, workspace_id: string, current_user_id: string) {
    const isOwner = await this.workspaceService.isWorkspaceOwner(workspace_id, current_user_id);
    const isMember = await this.workspaceService.isWorkspaceMember(workspace_id, current_user_id);
    if (!isOwner && !isMember) throw new Error('unauthorized');

    try {
      const client = await this.prisma.client.create({
        data: {
          workspaceId: workspace_id,
          name: data.name,
          email: data.email,
          phone: data.phone,
        },
      });
      return client;
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }

  async deleteClient(client_id: string, current_user_id: string) {
    try {
      const client = await this.prisma.client.findUnique({
        where: {
          id: client_id,
        },
      });
      if (!client) {
        throw new Error('client_not_found');
      }
      const isOwner = await this.workspaceService.isWorkspaceOwner(
        client.workspaceId,
        current_user_id,
      );
      const isMember = await this.workspaceService.isWorkspaceOwner(
        client.workspaceId,
        current_user_id,
      );
      if (!isOwner && !isMember) {
        throw new Error('unauthorized');
      }

      // await this.prisma.clientAssignment.deleteMany({
      //   where: {
      //     client_id: client_id,
      //   },
      // });
      await this.prisma.client.delete({
        where: {
          id: client_id,
        },
      });
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }
}
