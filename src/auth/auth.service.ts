import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import * as argon from 'argon2';

import { PrismaService } from 'src/prisma/prisma.service';

import { AuthDto } from './dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signup(dto: AuthDto) {
    //todo: generate the password hash
    const hash = await argon.hash(dto.password);

    //todo: save the new user in the DB
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
        //   select: {
        //     id: true,
        //     email: true,
        //     createdAt: true,
        //   },
      });
      delete user.hash; // temporary solution not to return hash... (or use select obj above)

      //todo: return the saved user
      return user;
    } catch (error) {
      if (
        error instanceof
        PrismaClientKnownRequestError
      ) {
        if (error.code === 'P2002') {
          throw new ForbiddenException(
            'Credentials taken',
          );
        }
      }
      throw error;
    }
  }

  signin() {
    return { msg: 'I have signed in!' };
  }
}
