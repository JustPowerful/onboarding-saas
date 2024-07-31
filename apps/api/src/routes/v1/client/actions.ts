import { FastifyPluginAsync } from 'fastify';
import { ClientService } from 'src/services/client.js';

const routes: FastifyPluginAsync = async (fastify, opt) => {
  const { prisma } = fastify;
  const clientService = new ClientService({
    prisma,
  });

  fastify.get('/getunassigned/:workspace_id', async (request, reply) => {
    const { workspace_id } = request.params as { workspace_id: string };
    const { search } = request.query as { search: string };
    const user_id = request.loggedUser.id;
    try {
      const clients = await clientService.getUnassignedClients(workspace_id, user_id, search);
      return reply.send({
        message: 'Unassigned clients fetched successfully',
        clients,
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.post('/create', async (request, reply) => {
    const { name, email, phone, workspace_id } = request.body as {
      name: string;
      email: string;
      phone: string;
      workspace_id: string;
    };
    const user_id = request.loggedUser.id;
    try {
      const client = await clientService.createClient(
        {
          name: name,
          email: email,
          phone: phone,
        },
        workspace_id,
        request.loggedUser.id,
      );
      return reply.send({
        message: 'Client created successfully',
        client,
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.delete('/delete/:client_id', async (request, reply) => {
    try {
      const { client_id } = request.params as { client_id: string };
      await clientService.deleteClient(client_id, request.loggedUser.id);
      return reply.send({
        message: 'Client deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  });
  fastify.get('/getall/:workspace_id', async (request, reply) => {
    const { workspace_id } = request.params as { workspace_id: string };
    try {
      const clients = await clientService.getClients(workspace_id, request.loggedUser.id);
      return reply.send({
        message: 'Clients fetched successfully',
        clients,
      });
    } catch (error) {
      throw error;
    }
  });
};

export default routes;
