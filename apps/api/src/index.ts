import { ajvFilePlugin } from '@fastify/multipart';
import { PrismaClient, User } from '@saas-monorepo/database';
import ajvFormat from 'ajv-formats';
// Require library to exit fastify process, gracefully (if possible)
import closeWithGrace from 'close-with-grace';
import { FastifyInstance, FastifyServerOptions, fastify } from 'fastify';

type Fastify = typeof fastify;
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    verifyToken: () => Promise<void>;
  }
  interface FastifyRequest {
    loggedUser: User;
  }
}

async function createServerApp(fastify: Fastify, opts: FastifyServerOptions) {
  const app: FastifyInstance = fastify(opts);

  app.register(import('./app.js')).ready((err) => {
    if (err) throw err;
    app.log.info('App ready');
  });

  return app;
}
//@ts-ignore
const app = await createServerApp(fastify, {
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  pluginTimeout: 20000,
  ajv: {
    customOptions: {
      allowUnionTypes: true,
      strict: false,
    },
    plugins: [ajvFormat, ajvFilePlugin],
  },
});

const closeListeners = closeWithGrace(
  {
    // delay is the number of milliseconds for the graceful close to finish
    delay: parseInt(process.env['FASTIFY_CLOSE_GRACE_DELAY'] as string) || 500,
  },
  async function ({ signal, err, manual }) {
    if (err) {
      app.log.error(err);
    }
    await app.close();
  } as closeWithGrace.CloseWithGraceAsyncCallback,
);
app.addHook('onClose', async () => {
  closeListeners.uninstall();
});
//server listen

const port = process.env['SERVER_PORT'] || 8000;
const host = process.env['SERVER_HOST'] || 'localhost';
app.listen({ host: host, port: parseInt(port as string) }, (err: any) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
});
