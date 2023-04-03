import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
	constructor(@InjectRepository(User) private repo: Repository<User>) {}

	create(accessToken: string, expirationTime: number, refreshToken: string, id42: number, name: string, avatar: string): Promise<User> {
		const user = this.repo.create({accessToken, expirationTime, refreshToken, id42, name, avatar});
		return this.repo.save(user);
	}

	findOne(id: number) {
		if (!id) {
			return null; // or throw an exception
		}
		return this.repo.findOneBy({id});
	}

	find(id42: number): Promise<User[]> {
		return this.repo.find({where: {id42}});
	}

	findAll(): Promise<User[]> {
		return this.repo.find();
	}

	async update(id: number, attrs: Partial<User>): Promise<User> {
		const user = await this.findOne(id);
		if (!user) {
			throw new NotFoundException("user not found");
		}
		Object.assign(user, attrs);
		return this.repo.save(user);
	}

	async remove(id: number): Promise<User> {
		const user = await this.findOne(id);
		if (!user) {
			throw new NotFoundException("user not found");
		}
		return this.repo.remove(user);
	}
}