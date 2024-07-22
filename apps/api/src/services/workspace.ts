import { PrismaClient } from '@saas-monorepo/database';
import { AbstractServiceOptions } from 'src/types/services.js';
import { WorkspacePayload } from 'src/types/workspace.js';

export class WorkspaceService {
  prisma: PrismaClient;
  constructor(options: AbstractServiceOptions) {
    this.prisma = options.prisma;
  }

  // creating a workspace requires a title and an owner_id
  async createWorkspace(data: WorkspacePayload) {
    try {
      return await this.prisma.workspace.create({
        data: {
          title: data.title,
          owner_id: data.owner_id,
        },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async getWorkspace(workspace_id: string, currentUserId: string) {
    // getting a workspace requires the user to be a member of the workspace or the owner of the workspace

    try {
      const currentUser = await this.prisma.user.findUnique({
        where: {
          id: currentUserId,
        },
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      const workspace = this.prisma.workspace.findUnique({
        where: {
          id: workspace_id,
          OR: [
            { owner_id: currentUserId },
            {
              members: {
                some: {
                  user_id: currentUserId,
                },
              },
            },
          ],
        },
        include: {
          owner: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
        },
      });
      return workspace;
    } catch (err: any) {
      throw err;
    }
  }

  async deleteWorkspace(workspace_id: string) {
    try {
      return await this.prisma.workspace.delete({
        where: {
          id: workspace_id,
        },
      });
    } catch (err: any) {
      throw err;
    }
  }

  async updateWorkspace(workspace_id: string, data: WorkspacePayload) {
    try {
      return await this.prisma.workspace.update({
        where: {
          id: workspace_id,
        },
        data: {
          title: data.title,
        },
      });
    } catch (err: any) {
      throw err;
    }
  }
}
