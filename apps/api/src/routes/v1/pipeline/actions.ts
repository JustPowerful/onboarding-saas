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
};

export default routes;
