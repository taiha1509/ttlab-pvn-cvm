import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { extractToken } from '../helpers/commonFunctions';
import { Auth0Service } from '../services/auth0.service';

@Injectable()
export class Auth0Guard implements CanActivate {
    constructor(private auth0Service: Auth0Service) {
        //
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            const request = context.switchToHttp().getRequest();
            const token = extractToken(request.headers.authorization || '');
            if (!token) {
                throw new UnauthorizedException();
            }
            const isValid = await this.auth0Service.verifyAccessToken(token);
            return isValid;
        } catch (error) {
            throw new UnauthorizedException();
        }
    }
}
