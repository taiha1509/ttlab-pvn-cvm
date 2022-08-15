import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { extractToken } from '../helpers/commonFunctions';
import * as jwt from 'jsonwebtoken';
import ConfigKey from '../config/config-key';
import { ILoginUser } from '../interfaces/auth.interfaces';

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(private readonly i18n: I18nRequestScopeService) {}

    keyExpiredAt = Date.now();

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = extractToken(request.headers.authorization || '');
        if (!token) {
            throw new UnauthorizedException();
        }
        const now = Date.now();
        const keyExpiredIn =
            +process.env[ConfigKey.TOKEN_PUBLIC_KEY_EXPIRED_IN];

        // public key is expired, request to update public key
        if (now > keyExpiredIn + this.keyExpiredAt) {
            // TODO implement request get public key from IAM server
            this.keyExpiredAt = Date.now();
        }

        request.loginUser = (await this.verifyToken(token)) as ILoginUser;

        return true;
    }

    async verifyToken(token: string) {
        const publicKey = process.env[ConfigKey.TOKEN_PUBLIC_KEY].replace(
            /\\n/g,
            '\n',
        );
        try {
            return await jwt.verify(token, publicKey, {
                ignoreExpiration: false,
                algorithms: ['RS256'],
            });
        } catch (error) {
            const message = await this.i18n.t('auth.message.unauthorized');
            throw new UnauthorizedException({ message });
        }
    }
}
