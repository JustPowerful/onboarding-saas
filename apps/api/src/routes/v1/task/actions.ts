import { FastifyPluginAsync } from 'fastify';
import { TaskService } from 'src/services/task.js';

const routes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  const { prisma } = fastify;
  const taskService = new TaskService({
    prisma,
  });
  fastify.post('/create', async (request, reply) => {
    const { title, description, client_assignment_id } = request.body as {
      title: string;
      description: string;
      client_assignment_id: string;
    };
    const currentUserId = request.loggedUser.id;

    try {
      const task = await taskService.createTask(
        {
          title,
          description,
          client_assignment_id,
        },
        currentUserId,
      );
      return reply.send({
        message: 'Created task successfully',
        task,
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.patch('/update/:task_id', async (request, reply) => {
    const { task_id } = request.params as { task_id: string };
    const { title, description, deadline } = request.body as {
      title: string;
      description: string;
      deadline: string;
    };
    const currentUserId = request.loggedUser.id;
    try {
      const task = await taskService.updateTask(
        task_id,
        {
          title,
          description,
          deadline: deadline ? new Date(deadline) : undefined,
        },
        currentUserId,
      );
      return reply.send({
        message: 'Successfully updated the task',
        task,
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.delete('/delete/:task_id', async (request, reply) => {
    const { task_id } = request.params as { task_id: string };
    const currentUserId = request.loggedUser.id;
    try {
      await taskService.deleteTask(task_id, currentUserId);
      return reply.send({
        message: 'Successfully deleted the task',
      });
    } catch (error) {}
  });
  fastify.get('/getall/:pipeline_id', async (request, reply) => {
    const { pipeline_id } = request.params as { pipeline_id: string };
    const currentUserId = request.loggedUser.id;
    try {
      const tasks = await taskService.getTasks(pipeline_id, currentUserId);
      return reply.send({
        message: 'Successfully fetched the tasks for this pipeline',
        tasks,
      });
    } catch (error) {
      throw error;
    }
  });

  // MANAGE MEMBERS OF A TASK
  fastify.post('/member/add', async (request, reply) => {
    const { task_id, user_id } = request.body as { task_id: string; user_id: string };
    const currentUserId = request.loggedUser.id;
    try {
      await taskService.assignMember(task_id, user_id, currentUserId);
      return reply.send({
        message: 'Successfully added the member to the task',
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.delete('/member/remove/:task_id/:member_id', async (request, reply) => {
    const { task_id, member_id } = request.params as { task_id: string; member_id: string };
    const currentUserId = request.loggedUser.id;
    try {
      await taskService.removeMember(task_id, member_id, currentUserId);
      return reply.send({
        message: 'Successfully removed the member from the task',
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.get('/member/getunassigned', async (request, reply) => {
    const { task_id, search } = request.query as { task_id: string; search: string };
    const currentUserId = request.loggedUser.id;
    try {
      const members = await taskService.getUnassignedMembers(task_id, search, currentUserId);
      return reply.send({
        message: 'Successfully fetched unassigned members',
        members,
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.get('/member/getassigned/:task_id', async (request, reply) => {
    const { task_id } = request.params as { task_id: string };
    const currentUserId = request.loggedUser.id;
    try {
      const members = await taskService.getAssignedMembers(task_id, currentUserId);
      return reply.send({
        message: 'Successfully fetched assigned members',
        members,
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.patch('/complete', async (request, reply) => {
    const { task_id } = request.body as { task_id: string };
    const currentUserId = request.loggedUser.id;
    try {
      const task = await taskService.completeTask(task_id, currentUserId);
      return reply.send({
        message: 'Successfully completed the task',
        task,
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.patch('/uncomplete', async (request, reply) => {
    const { task_id } = request.body as { task_id: string };
    const currentUserId = request.loggedUser.id;
    try {
      const task = await taskService.uncompleteTask(task_id, currentUserId);
      return reply.send({
        message: 'Successfully uncompleted the task',
        task,
      });
    } catch (error) {
      throw error;
    }
  });
};

export default routes;
