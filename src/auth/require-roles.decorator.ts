import { UseGuards, applyDecorators } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

export const RequireRoles = (roles: string[]) => {
  return applyDecorators(
    UseGuards(
      AuthGuard,
      new RolesGuard(roles),
    ),
  );
};
