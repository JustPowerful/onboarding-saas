import { Permission } from '@saas-monorepo/database';
import { FastifyPluginAsync } from 'fastify';
import {
  createWorkspaceSchema,
  deleteWorkspaceSchema,
  getAllWorkspacesSchema,
  getWorkspaceSchema,
  updateWorkspaceSchema,
} from 'src/schemas/workspace.js';
import { PipelineService } from 'src/services/pipeline.js';
import { WorkspaceService } from 'src/services/workspace.js';
import { WorkspacePayload } from 'src/types/workspace.js';

const routes: FastifyPluginAsync = async (fastify, opt) => {
  const { prisma } = fastify;
  // initialize the service
  const workspaceService = new WorkspaceService({
    prisma,
  });
  const pipelineService = new PipelineService({
    prisma,
  });
  fastify.post(
    '/create',
    {
      schema: createWorkspaceSchema,
    },
    async (request, reply) => {
      const { title } = request.body as WorkspacePayload;
      const current_user_id = request.loggedUser.id;

      try {
        const workspace = await workspaceService.createWorkspace({
          title: title,
          owner_id: current_user_id,
        });
        await pipelineService.createPipeline({
          default: true,
          title: 'Client assignment/discussion',
          workspace_id: workspace.id,
          owner_id: current_user_id,
        });
        // after creating the workspace, we create a default pipeline
        return reply.send({
          message: 'Workspace created successfully',
          workspace_id: workspace.id,
        });
      } catch (error: any) {
        throw error;
      }
    },
  );

  fastify.get(
    '/getall',
    {
      schema: getAllWorkspacesSchema,
    },
    async (request, reply) => {
      const currentUserId = request.loggedUser.id;
      try {
        const workspaces = await workspaceService.getAllWorkspaces(currentUserId);
        return reply.send({
          message: 'Workspaces fetched successfully',
          workspaces,
        });
      } catch (error) {
        throw error;
      }
    },
  );

  fastify.get(
    '/get/:workspace_id',
    {
      schema: getWorkspaceSchema,
    },
    async (request, reply) => {
      const { workspace_id } = request.params as { workspace_id: string };
      try {
        const workspace = await workspaceService.getWorkspace(workspace_id, request.loggedUser.id);
        if (!workspace) {
          return reply.code(404).send({
            message: 'Workspace not found',
          });
        }
        return reply.send({
          message: 'Workspace fetched successfully',
          workspace,
        });
      } catch (error: any) {
        throw error;
      }
    },
  );

  fastify.patch(
    '/update/:workspace_id',
    {
      schema: updateWorkspaceSchema,
    },
    async (request, reply) => {
      try {
        const { workspace_id } = request.params as { workspace_id: string };
        const body = request.body as WorkspacePayload;
        const workspace = await workspaceService.updateWorkspace(
          workspace_id,
          request.loggedUser.id,
          body,
        );
        return reply.send({
          message: 'Workspace updated successfully',
          workspace_id: workspace.id,
        });
      } catch (error) {
        throw error;
      }
    },
  );

  fastify.delete(
    '/delete/:workspace_id',
    {
      schema: deleteWorkspaceSchema,
    },
    async (request, reply) => {
      try {
        const { workspace_id } = request.params as { workspace_id: string };
        await workspaceService.deleteWorkspace(workspace_id, request.loggedUser.id);
        return reply.send({
          message: 'Workspace deleted successfully',
        });
      } catch (error) {
        throw error;
      }
    },
  );
  fastify.post('/member/add', async (request, reply) => {
    const { workspace_id, email, permission } = request.body as {
      workspace_id: string;
      email: string;
      permission: Permission;
    };
    try {
      await workspaceService.addMember(workspace_id, email, permission, request.loggedUser.id);
      return reply.send({
        message: 'Member added successfully',
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.delete('/member/remove/:workspace_id/:user_id', async (request, reply) => {
    const { workspace_id, user_id } = request.params as { workspace_id: string; user_id: string };
    try {
      await workspaceService.removeMember(workspace_id, user_id, request.loggedUser.id);
      return reply.send({
        message: 'Member removed successfully',
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.get('/member/getall/:workspace_id', async (request, reply) => {
    const { workspace_id } = request.params as { workspace_id: string };
    try {
      const users = await workspaceService.getMembers(workspace_id, request.loggedUser.id);
      return reply.send({
        message: 'Members fetched successfully',
        users,
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.patch('/member/update', async (request, reply) => {
    const { member_id, workspace_id, permission } = request.body as {
      member_id: string;
      workspace_id: string;
      permission: Permission;
    };
    const currentUserId = request.loggedUser.id;
    try {
      const member = await workspaceService.updateMemberPermission(
        member_id,
        workspace_id,
        permission,
        currentUserId,
      );
      return reply.send({
        message: 'Member permission updated successfully',
        member,
      });
    } catch (error) {
      throw error;
    }
  });
};

export default routes;
