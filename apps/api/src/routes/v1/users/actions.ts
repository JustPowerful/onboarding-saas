import { FastifyPluginAsync } from 'fastify';

import { getLoggedUserDataSchema } from '../../../schemas/users.js';
import { UsersService } from '../../../services/users.js';

const routes: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  const { prisma } = fastify;
  const usersService = new UsersService({ prisma });
  fastify.get(
    '/me',
    {
      schema: getLoggedUserDataSchema,
    },
    async (request, reply) => {
      try {
        const data = await usersService.getLoggedUserData(request.loggedUser.id);
        return reply.code(200).send({
          user: data,
        });
      } catch (err) {
        throw err;
      }
    },
  );
};
export default routes;
