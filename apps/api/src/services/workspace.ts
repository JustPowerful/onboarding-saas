import { PrismaClient, Workspace } from '@saas-monorepo/database';
import { AbstractServiceOptions } from 'src/types/services.js';
import { WorkspacePayload } from 'src/types/workspace.js';

export class WorkspaceService {
  prisma: PrismaClient;
  constructor(options: AbstractServiceOptions) {
    this.prisma = options.prisma;
  }

  async isWorkspaceOwner(workspace_id: string, user_id: string) {
    try {
      const workspace = await this.prisma.workspace.findUnique({
        where: {
          id: workspace_id,
        },
      });
      if (!workspace) throw new Error('workspace_not_found');
      const user = await this.prisma.user.findUnique({
        where: {
          id: user_id,
        },
      });
      if (!user) throw new Error('user_not_found');
      return workspace.owner_id === user.id;
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }
  async isWorkspaceMember(workspace_id: string, user_id: string) {
    try {
      const workspace = await this.prisma.workspace.findUnique({
        where: {
          id: workspace_id,
          members: {
            some: {
              user_id: user_id,
            },
          },
        },
        // include: {
        //   members: true,
        // }
      });
      if (!workspace) return false;
      return true;
    } catch (error) {}
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

  async getAllWorkspaces(currentUserId: string) {
    try {
      const workspaces = await this.prisma.workspace.findMany({
        where: {
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
          clients: true,
        },
      });
      return workspaces;
    } catch (error) {
      throw new Error('internal_server_error');
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
          clients: true,
        },
      });
      return workspace;
    } catch (err: any) {
      throw err;
    }
  }

  async deleteWorkspace(workspace_id: string, current_user_id: string) {
    try {
      if (await this.isWorkspaceOwner(workspace_id, current_user_id)) {
        const workspace = await this.prisma.workspace.delete({
          where: {
            id: workspace_id,
          },
        });

        return workspace;
      } else {
        throw new Error('unauthorized');
      }
    } catch (err: any) {
      throw err;
    }
  }

  async updateWorkspace(workspace_id: string, current_user_id: string, data: WorkspacePayload) {
    try {
      if (!this.isWorkspaceOwner(workspace_id, current_user_id)) {
        throw new Error('unauthorized');
      }
      const workspace = await this.prisma.workspace.update({
        where: {
          id: workspace_id,
        },
        data: {
          title: data.title,
        },
      });
      return workspace as Workspace;
    } catch (err: any) {
      throw new Error('internal_server_error');
    }
  }
}
