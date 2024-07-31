import { FastifyPluginAsync } from 'fastify';
import { CreatePipelineSchema } from 'src/schemas/pipeline.js';
import { PipelineService } from 'src/services/pipeline.js';
import { PipelinePayload } from 'src/types/pipeline.js';

const routes: FastifyPluginAsync = async (fastify, opt) => {
  const { prisma } = fastify;
  const pipelineService = new PipelineService({
    prisma,
  });

  fastify.post(
    '/create',
    {
      schema: CreatePipelineSchema,
    },
    async (request, reply) => {
      // work on it here
      const { title, workspace_id } = request.body as PipelinePayload;
      const owner_id = request.loggedUser.id;
      try {
        // TODO: check if the user is a member of the workspace
        const pipeline = await pipelineService.createPipeline({
          default: false,
          title: title,
          workspace_id: workspace_id,
          owner_id: owner_id,
        });
        return reply.send({
          message: 'Pipeline created successfully',
          pipeline,
        });
      } catch (error) {
        throw new Error('internal_server_error');
      }
    },
  );

  fastify.patch('/update/:pipeline_id', async (request, reply) => {
    try {
      const { pipeline_id } = request.params as { pipeline_id: string };
      const { title } = request.body as { title: string };
      const user_id = request.loggedUser.id;
      await pipelineService.updatePipeline(pipeline_id, { title, default: false }, user_id);
      return reply.send({
        message: 'Pipeline updated successfully',
      });
    } catch (error) {
      throw error;
    }
  });

  fastify.delete('/delete/:pipeline_id', async (request, reply) => {
    const { pipeline_id } = request.params as { pipeline_id: string };
    try {
      await pipelineService.deletePipeline(pipeline_id, request.loggedUser.id);
      return reply.send({
        message: 'Pipeline deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  });

  fastify.get('/getall/:workspace_id', async (request, reply) => {
    const workspace_id = (request.params as { workspace_id: string }).workspace_id;
    const user_id = request.loggedUser.id;
    try {
      const pipelines = await pipelineService.getPipelines(workspace_id, user_id);
      return reply.send({
        message: 'Pipelines fetched successfully',
        pipelines,
      });
    } catch (error) {
      throw error;
    }
  });

  fastify.post('/clientassignment/create', async (request, reply) => {
    const { pipeline_id, client_id } = request.body as { pipeline_id: string; client_id: string };
    const user_id = request.loggedUser.id;
    try {
      await pipelineService.createClientAssignment(pipeline_id, client_id, user_id);
      return reply.send({
        message: 'Client assignment created successfully',
      });
    } catch (error: any) {
      throw error;
    }
  });

  fastify.patch('/updateorder/:workspace_id', async (request, reply) => {
    const { workspace_id } = request.params as { workspace_id: string };
    const { pipelines } = request.body as { pipelines: any[] };
    const current_user_id = request.loggedUser.id;
    try {
      await pipelineService.updateOrder(pipelines, workspace_id, current_user_id);
      return reply.send({
        message: 'Successfully updated pipeline and client assignment order',
      });
    } catch (error) {
      throw error;
    }
  });
};

export default routes;
