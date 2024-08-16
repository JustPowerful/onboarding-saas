import { PrismaClient } from '@saas-monorepo/database';
import { pipeline } from 'node:stream';
import { AbstractServiceOptions } from 'src/types/services.js';
import { TaskPayload, TaskUpdatePayload } from 'src/types/task.js';

import { WorkspaceService } from './workspace.js';

export class TaskService {
  prisma: PrismaClient;
  workspaceService: WorkspaceService;
  constructor(options: AbstractServiceOptions) {
    this.prisma = options.prisma;
    this.workspaceService = new WorkspaceService(options);
  }

  // used this privately inside the service to get the client assignment
  // it cannot be used outside of the service
  private async getClientAssignment(assignment_id: string) {
    try {
      return await this.prisma.clientAssignment.findUnique({
        where: {
          id: assignment_id,
        },
        include: {
          pipline: {
            include: {
              workspace: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      throw new Error('client_assignment_not_found');
    }
  }

  async createTask(data: TaskPayload, current_user_id: string) {
    try {
      const clientAssignment = await this.getClientAssignment(data.client_assignment_id);
      if (!clientAssignment) throw new Error('client_assignment_not_found');
      const workspace_id = clientAssignment.pipline.workspace.id;
      const isOwner = await this.workspaceService.isWorkspaceOwner(workspace_id, current_user_id);
      const isMember = await this.workspaceService.isWorkspaceMember(workspace_id, current_user_id);
      if (!isOwner && !isMember) {
        throw new Error('unauthorized');
      }

      const latest = await this.prisma.task.findFirst({
        where: {
          client_assignment_id: data.client_assignment_id,
        },
        select: { pos: true },
        orderBy: {
          pos: 'desc',
        },
      });
      const pos = latest ? latest.pos + 1 : 0;

      const task = await this.prisma.task.create({
        data: {
          title: data.title,
          description: data.description,
          client_assignment_id: data.client_assignment_id,
          pos: pos,
        },
      });
      return task;
    } catch (error) {
      throw new Error('internal_server_error');
      // throw error;
    }
  }

  async deleteTask(task_id: string, current_user_id: string) {
    try {
      const task = await this.prisma.task.findUnique({
        where: {
          id: task_id,
        },
        select: {
          client_assignment: {
            select: {
              pipline: {
                select: {
                  workspace_id: true,
                },
              },
            },
          },
        },
      });

      if (!task) {
        throw new Error('task_not_found');
      }

      const workspace_id = task.client_assignment.pipline.workspace_id;
      const isOwner = this.workspaceService.isWorkspaceOwner(workspace_id, current_user_id);
      const isMember = this.workspaceService.isWorkspaceMember(workspace_id, current_user_id);

      if (!isOwner && !isMember) {
        throw new Error('unauthorized');
      }

      await this.prisma.task.delete({
        where: {
          id: task_id,
        },
      });
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }

  async getTasks(pipeline_id: string, current_user_id: string) {
    try {
      const pipeline = await this.prisma.pipeline.findUnique({
        where: {
          id: pipeline_id,
        },
        include: {
          workspace: {
            select: {
              id: true,
            },
          },
        },
      });
      if (!pipeline) throw new Error('pipeline_not_found');
      const workspaceId = pipeline.workspace.id;
      const isOwner = await this.workspaceService.isWorkspaceOwner(workspaceId, current_user_id);
      const isMember = await this.workspaceService.isWorkspaceMember(workspaceId, current_user_id);
      if (!isOwner && !isMember) throw new Error('unauthorized');
      const tasks = await this.prisma.task.findMany({
        where: {
          client_assignment: {
            pipeline_id: pipeline_id,
          },
        },
        include: {
          user_assignments: {
            select: {
              user: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  email: true,
                },
              },
            },
          },
        },
      });
      return tasks;
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }

  async updateTask(task_id: string, data: TaskUpdatePayload, current_user_id: string) {
    try {
      const task = await this.prisma.task.findUnique({
        where: {
          id: task_id,
        },
        include: {
          client_assignment: {
            select: {
              pipline: {
                select: {
                  workspace_id: true,
                },
              },
            },
          },
        },
      });
      if (!task) throw new Error('task_not_found');
      const workspaceId = task.client_assignment.pipline.workspace_id;
      const isOwner = this.workspaceService.isWorkspaceOwner(workspaceId, current_user_id);
      const isMember = this.workspaceService.isWorkspaceMember(workspaceId, current_user_id);
      if (!isOwner && !isMember) throw new Error('unauthorized');
      return await this.prisma.task.update({
        where: {
          id: task_id,
        },
        data: {
          title: data.title,
          description: data.description,
          deadline: data.deadline,
        },
      });
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }
  async getUnassignedMembers(task_id: string, search: string, current_user_id: string) {
    try {
      const task = await this.prisma.task.findUnique({
        where: {
          id: task_id,
        },
        include: {
          client_assignment: {
            select: {
              pipline: {
                select: {
                  id: true,
                  workspace_id: true,
                },
              },
            },
          },
        },
      });
      if (!task) throw new Error('task_not_found');
      const workspaceId = task.client_assignment.pipline.workspace_id;
      const isMember = await this.workspaceService.isWorkspaceMember(workspaceId, current_user_id);
      const isOwner = await this.workspaceService.isWorkspaceOwner(workspaceId, current_user_id);

      if (!isOwner && !isMember) throw new Error('unauthorized');
      let searchCondition = {};
      if (search) {
        searchCondition = {
          OR: [
            { firstname: { contains: search, mode: 'insensitive' } },
            { lastname: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        };
      }
      // get the members that are assigned in the workspaces but never assigned in this task
      const members = await this.prisma.user.findMany({
        where: {
          ...searchCondition,
          workspaces: {
            some: {
              workspace_id: workspaceId,
            },
          },
          assignments: {
            none: {
              task_id: task_id,
            },
          },
          user_on_client_assignments: {
            some: {
              client_assignment_id: task.client_assignment_id,
            },
          },
          // allowed_pipelines: {
          //   some: {
          //     pipeline_id: task.client_assignment.pipline.id,
          //   },
          // },
        },
      });
      return members;
    } catch (error) {}
  }
  async getAssignedMembers(task_id: string, current_user_id: string) {
    const task = await this.prisma.task.findUnique({
      where: {
        id: task_id,
      },
      include: {
        client_assignment: {
          select: {
            pipline: {
              select: {
                workspace_id: true,
              },
            },
          },
        },
      },
    });

    if (!task) throw new Error('task_not_found');
    const workspaceId = task.client_assignment.pipline.workspace_id;
    const isMember = await this.workspaceService.isWorkspaceMember(workspaceId, current_user_id);
    const isOwner = await this.workspaceService.isWorkspaceOwner(workspaceId, current_user_id);
    if (!isOwner && !isMember) throw new Error('unauthorized');
    const members = await this.prisma.user.findMany({
      where: {
        assignments: {
          some: {
            task_id: task_id,
          },
        },
      },
    });
    return members;
  }
  async assignMember(task_id: string, member_id: string, current_user_id: string) {
    try {
      const task = await this.prisma.task.findUnique({
        where: {
          id: task_id,
        },
        include: {
          client_assignment: {
            select: {
              pipline: {
                select: {
                  workspace_id: true,
                },
              },
            },
          },
        },
      });
      console.log('MEMBER id::::::: ', member_id);
      if (!task) throw new Error('task_not_found');
      const workspaceId = task.client_assignment.pipline.workspace_id;
      const isMember = await this.workspaceService.isWorkspaceMember(workspaceId, current_user_id);
      const isOwner = await this.workspaceService.isWorkspaceOwner(workspaceId, current_user_id);
      if (!isOwner && !isMember) throw new Error('unauthorized');
      const member = await this.prisma.user.findUnique({
        where: {
          id: member_id,
          assignments: {
            some: {
              task_id: task_id,
            },
          },
        },
      });
      if (member) throw new Error('member_already_assigned');
      await this.prisma.userAssignment.create({
        data: {
          user_id: member_id,
          task_id: task_id,
        },
      });
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }
  async removeMember(task_id: string, member_id: string, current_user_id: string) {
    try {
      const task = await this.prisma.task.findUnique({
        where: {
          id: task_id,
        },
        include: {
          client_assignment: {
            select: {
              pipline: {
                select: {
                  workspace_id: true,
                },
              },
            },
          },
        },
      });
      if (!task) throw new Error('task_not_found');
      const workspaceId = task.client_assignment.pipline.workspace_id;
      const isMember = await this.workspaceService.isWorkspaceMember(workspaceId, current_user_id);
      const isOwner = await this.workspaceService.isWorkspaceOwner(workspaceId, current_user_id);
      if (!isOwner && !isMember) throw new Error('unauthorized');
      await this.prisma.userAssignment.deleteMany({
        where: {
          user_id: member_id,
          task_id: task_id,
        },
      });
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }

  async completeTask(task_id: string, current_user_id: string) {
    try {
      const task = await this.prisma.task.findUnique({
        where: {
          id: task_id,
        },
        include: {
          client_assignment: {
            select: {
              pipline: {
                select: {
                  workspace_id: true,
                },
              },
            },
          },
        },
      });
      if (!task) throw new Error('task_not_found');
      const workspaceId = task.client_assignment.pipline.workspace_id;
      const isMember = await this.workspaceService.isWorkspaceMember(workspaceId, current_user_id);
      const isOwner = await this.workspaceService.isWorkspaceOwner(workspaceId, current_user_id);
      if (!isOwner && !isMember) throw new Error('unauthorized');
      return await this.prisma.task.update({
        where: {
          id: task_id,
        },
        data: {
          completed: true,
        },
      });
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }
  async uncompleteTask(task_id: string, current_user_id: string) {
    try {
      const task = await this.prisma.task.findUnique({
        where: {
          id: task_id,
        },
        include: {
          client_assignment: {
            select: {
              pipline: {
                select: {
                  workspace_id: true,
                },
              },
            },
          },
        },
      });
      if (!task) throw new Error('task_not_found');
      const workspaceId = task.client_assignment.pipline.workspace_id;
      const isMember = await this.workspaceService.isWorkspaceMember(workspaceId, current_user_id);
      const isOwner = await this.workspaceService.isWorkspaceOwner(workspaceId, current_user_id);
      if (!isOwner && !isMember) throw new Error('unauthorized');
      return await this.prisma.task.update({
        where: {
          id: task_id,
        },
        data: {
          completed: false,
        },
      });
    } catch (error) {
      throw new Error('internal_server_error');
    }
  }
}
