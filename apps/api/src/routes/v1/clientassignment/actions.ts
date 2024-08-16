import { FastifyPluginAsync } from 'fastify';
import { ClientAssignmentService } from 'src/services/clientassignment.js';
import { PipelineService } from 'src/services/pipeline.js';

const routes: FastifyPluginAsync = async (fastify, opt) => {
  const { prisma } = fastify;
  const clientAssignmentService = new ClientAssignmentService({ prisma });
  const pipelineService = new PipelineService({ prisma });

  fastify.post('/create', async (request, reply) => {
    const { pipeline_id, client_id } = request.body as { pipeline_id: string; client_id: string };
    const user_id = request.loggedUser.id;
    try {
      await clientAssignmentService.createClientAssignment(pipeline_id, client_id, user_id);
      return reply.send({
        message: 'Client assignment created successfully',
      });
    } catch (error: any) {
      throw error;
    }
  });

  fastify.delete('/delete/:client_assignment_id', async (request, reply) => { 
    const { client_assignment_id } = request.params as { client_assignment_id: string };
    const currentUserId = request.loggedUser.id;
    try {
      await clientAssignmentService.removeClientAssignment(client_assignment_id, currentUserId);
      return reply.send({
        message: 'Client assignment deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  });

  fastify.get('/get/:pipeline_id', async (request, reply) => {
    const { pipeline_id } = request.params as { pipeline_id: string };
    const currentUserId = request.loggedUser.id;
    try {
      const assignment = await pipelineService.getClientAssignment(pipeline_id, currentUserId);
      return reply.send({
        message: 'Client assignment fetched successfully',
        assignment,
      });
    } catch (error) {
      throw error;
    }
  });

  fastify.post('/member/add', async (request, reply) => {
    const { client_assignment_id, user_id } = request.body as {
      client_assignment_id: string;
      user_id: string;
    };
    const currentUserId = request.loggedUser.id;
    try {
      const member = await clientAssignmentService.addMember(
        client_assignment_id,
        user_id,
        currentUserId,
      );
      return reply.send({
        message: 'The user has been added successfully',
        member,
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.delete('/member/remove/:client_assignment_id/:user_id', async (request, reply) => {
    const { client_assignment_id, user_id } = request.params as {
      client_assignment_id: string;
      user_id: string;
    };
    const currentUserId = request.loggedUser.id;
    try {
      await clientAssignmentService.removeMember(client_assignment_id, user_id, currentUserId);
      return reply.send({
        message: 'Successfully removed the member from the client assignment',
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.get('/member/getunassigned', async (request, reply) => {
    const { client_assignment_id, search } = request.query as {
      client_assignment_id: string;
      search: string;
    };
    try {
      const members = await clientAssignmentService.getUnassignedMembers(
        client_assignment_id,
        search,
        request.loggedUser.id,
      );
      return reply.send({
        message: 'Successfully fetched unassigned members',
        members,
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.get('/member/getassigned', async (request, reply) => {
    const { client_assignment_id, search } = request.query as {
      client_assignment_id: string;
      search: string;
    };

    try {
      const members = await clientAssignmentService.getAssignedMembers(
        client_assignment_id,
        search,
        request.loggedUser.id,
      );
      return reply.send({
        message: 'Successfully fetched assigned members',
        members,
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.patch('/update', async (request, reply) => {
    const { client_assignment_id, data } = request.body as {
      client_assignment_id: string;
      data: {
        deadline: Date;
      };
    };
    const currentUserId = request.loggedUser.id;
    try {
      await clientAssignmentService.updateClientAssignment(
        client_assignment_id,
        data,
        currentUserId,
      );
      return reply.send({
        message: 'Client assignment updated successfully',
      });
    } catch (error) {
      throw error;
    }
  });
};

export default routes;
