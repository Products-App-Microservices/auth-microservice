import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { RegisterUserDto } from './dtos';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  onModuleInit() {
    this.$connect();
    this.logger.log('Database connected (MongoDB)');
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, name, password } = registerUserDto;

    try {
      const user = await this.user.findFirst({
        where: { email } 
      });

      if (user) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'User already exists'
        });
      }

      const newUser = await this.user.create({
        data: {
          name: name,
          email: email,
          password: await bcrypt.hash( password, 10 ),
        }
      })

      const { password: __, ...rest } = newUser;

      return {
        user: rest,
        token: 'ABC123',
      }
    
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      })
    }
  }

  async loginUser() {
    return 'Login user';
  }

  async verifyToken() {
    return 'Verify token';
  }

}
