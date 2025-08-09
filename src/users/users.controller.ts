import { Body, Controller, Delete, Param, Patch, Post, UseGuards, Get, Query, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { GetUsersDto } from './dto/get-users.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.usersService.softDeleteUser(id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Patch(':id/password')
  setPassword(@Param('id') id: string, @Body() dto: UpdatePasswordDto) {
    return this.usersService.setPassword(id, dto);
  }

  @Get()
  async findAll(@Query() query: GetUsersDto) {
    return this.usersService.getUsers(query.page, query.limit, query.search);
  }
  
}
