import { Prisma, PrismaClient, User } from '@saas-monorepo/database';

import { AbstractServiceOptions } from '../types/services.js';

export class UsersService {
  prisma: PrismaClient;
  constructor(options: AbstractServiceOptions) {
    this.prisma = options.prisma;
  }
  async getLoggedUserData(id: string) {
    try {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: {
          id: id,
        },
        select: {
          firstname: true,
          lastname: true,
          email: true,
          create_at: true,
          updated_at: true,
        },
      });
      console.log(user);
      return user;
    } catch (err: any) {
      throw err;
    }
  }
}
