import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

import { AuthDto } from 'src/auth/dto';
import { EditUserDto } from 'src/user/dto';
import {
  CreateBookmarkDto,
  EditBookmarkDto,
} from 'src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );

    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);

    await prisma.cleanDb();

    pactum.request.setBaseUrl(
      'http://localhost:3333',
    );
  });

  afterAll(() => {
    app.close();
  });

  it.todo('should pass');

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'oleh@gmail.com',
      password: '123',
    };

    describe('Signup', () => {
      it('should throw an exception if email is empty', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: '123',
          })
          .expectStatus(400);
      });

      it('should throw an exception if password is empty', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: 'oleh@gmail.com',
          })
          .expectStatus(400);
      });

      it('should throw an exception if no body provided', async () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .expectStatus(400);
      });

      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('Signin', () => {
      it('should throw an exception if email is empty', async () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: '123',
          })
          .expectStatus(400);
      });

      it('should throw an exception if password is empty', async () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: 'oleh@gmail.com',
          })
          .expectStatus(400);
      });

      it('should throw an exception if no body provided', async () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .expectStatus(400);
      });

      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}', // pactum syntax to provide auth-token
          })
          .expectStatus(200);
      });
    });

    describe('Edit user', () => {
      it('should edit user', () => {
        const dto: EditUserDto = {
          firstName: 'Olly',
          email: 'olly@gmail.com',
        };
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}', // pactum syntax to provide auth-token
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email);
      });
    });
  });

  describe('Bookmarks', () => {
    describe('Get empty bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}', // pactum syntax to provide auth-token
          })
          .expectStatus(200)
          .expectBody([]);
      });
    });

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'First Bookmark',
        link: 'https://youtu.be/GHTA143_b-s?si=zA7kX9eEOd1xXdKm',
      };

      it('should create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}', // pactum syntax to provide auth-token
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
    });

    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}', // pactum syntax to provide auth-token
          })
          .expectStatus(200)
          .expectJsonLength(1);
        // .inspect();
      });
    });

    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}', // pactum syntax to provide auth-token
          })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}'); //.expectJsonMatch({id: '$S{bookmarkId}'}) would have been the correct way of testing to prevent false positive matches with other numbers, user id etc.
      });
    });

    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        title:
          'NestJs Course for Beginners - Create a REST API',
        description:
          'Learn NestJs by building a CRUD REST API with end-to-end tests using modern web development techniques.',
      };

      it('should edit bookmark by id', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}', // pactum syntax to provide auth-token
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description);
      });
    });

    describe('Delete bookmark by id', () => {
      it('should delete bookmark by id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}', // pactum syntax to provide auth-token
          })
          .expectStatus(204);
      });

      it('should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}', // pactum syntax to provide auth-token
          })
          .expectStatus(200)
          .expectJsonLength(0);
        // .inspect();
      });
    });
  });
});
