import { applyDecorators } from '@nestjs/common';
import { Roles } from './roles.decorator';
import { UserRole } from '@prisma/client';

export function RolesMin(minRole: UserRole) {
  const roleHierarchy = [
    UserRole.view,
    UserRole.request,
    UserRole.approve,
    UserRole.admin,
  ];

  const allowedRoles = roleHierarchy.slice(roleHierarchy.indexOf(minRole));
  return applyDecorators(Roles(...allowedRoles));
}
