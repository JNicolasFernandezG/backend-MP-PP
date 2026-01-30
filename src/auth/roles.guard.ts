import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly allowedRoles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    if (!this.allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere rol: ${this.allowedRoles.join(' o ')}. Tu rol: ${user.role}`,
      );
    }

    return true;
  }
}
