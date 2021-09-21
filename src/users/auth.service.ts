import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { promisify } from 'util';
import { UsersService } from './users.service';
import { randomBytes, scrypt as _script } from 'crypto';

const scrypt = promisify(_script);

@Injectable()
export class AuthService {
  constructor(private UsersService: UsersService) {}
  async signup(email: string, password: string) {
    const users = await this.UsersService.find(email);
    if (users.length) {
      throw new BadRequestException('email in user');
    }

    const salt = randomBytes(8).toString('hex');

    const hash = (await scrypt(password, salt, 32)) as Buffer;

    const result = salt + '.' + hash.toString('hex');

    const user = await this.UsersService.create(email, result);

    return user;
  }

  async signin(email: string, password: string) {
    const [user] = await this.UsersService.find(email);
    if (!user) {
      throw new NotFoundException('no user found');
    }

    const [salt, storedHash] = user.password.split('.');

    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      throw new BadRequestException('bad password');
    }
    return user;
  }
}
