import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { LoginUserDto, RegisterUserDto } from './dtos';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces';
import { envs } from 'src/config/envs';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  onModuleInit() {
    this.$connect();
    this.logger.log('Database connected (MongoDB)');
  }

  constructor(
    private readonly jwtService: JwtService,
  ) { super(); }

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
        token: this.signToken(rest),
      }
    
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      })
    }
  }

  async loginUser( loginUserDto: LoginUserDto ) {
    const { email, password } = loginUserDto;

    try {
      const user = await this.user.findFirst({
        where: { email }
      });
  
      if (!user) {
        throw new RpcException({
          status: HttpStatus.UNAUTHORIZED,
          message: 'Invalid credentials',
        });
      }
  
      const isValidPassword = bcrypt.compareSync( password, user.password );
  
      if (!isValidPassword) {
        throw new RpcException({
          status: HttpStatus.UNAUTHORIZED,
          message: 'Invalid credentials',
        });
      }
  
      const { password: __, ...rest } = user;
  
      return {
        ...rest,
        token: this.signToken(rest),
      }
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      })
    }


  }

  async verifyToken(token: string) {
    try {
      const { sub, iat, exp, ...user } = this.jwtService.verify(token, {
        secret: envs.JWT_SECRET,
      });

      return {
        user,
        token: this.signToken(user),
      }

    } catch (error) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token'
      });
    }
  }

  private signToken(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  } 

}
