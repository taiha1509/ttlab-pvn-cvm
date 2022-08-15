import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { I18nRequestScopeService } from 'nestjs-i18n';
import * as _ from 'lodash';
import { createWinstonLogger } from '../services/winston.service';
import { ConfigService } from '@nestjs/config';
import {
    deviceAdminResources,
    PermissionResources,
    systemAdminResources,
    UserTypes,
} from '../constants';
import { intersection, uniq } from 'lodash';
@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private readonly i18n: I18nRequestScopeService,
        private readonly configService: ConfigService,
    ) {}

    private readonly logger = createWinstonLogger(
        'roleGuard',
        this.configService,
    );

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const routeRequiredPermissions = this.reflector.get<string[]>(
                'permissions',
                context.getHandler(),
            );
            // this route unneed any permission
            if (
                !routeRequiredPermissions ||
                routeRequiredPermissions?.length === 0
            ) {
                return true;
            }

            const resources = uniq(
                routeRequiredPermissions.map((rrp) => rrp.split('_')[0]),
            );

            const user = request.loginUser;
            // this is system admin
            if ((user?.type || []).includes(UserTypes.SYSTEM_ADMIN)) {
                if (intersection(systemAdminResources, resources).length > 0)
                    return true;
            }
            // this is device admin
            if ((user?.type || []).includes(UserTypes.SYSTEM_ADMIN)) {
                if (intersection(deviceAdminResources, resources).length > 0)
                    return true;
            }

            const loginUserPermissions: string[] = [];
            (user.roles || []).forEach((role) => {
                role.permissions
                    .filter((item) => item)
                    .forEach((item) => {
                        loginUserPermissions.push(
                            `${item.resource.content}_${item.action.content}`,
                        );
                    });
            });
            return (
                _.intersection(loginUserPermissions, routeRequiredPermissions)
                    .length > 0
            );
        } catch (error) {
            this.logger.error('canActivate, Unhandled role exception');
            throw new ForbiddenException();
        }
    }
}
