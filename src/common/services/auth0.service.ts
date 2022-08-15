import { HttpModule, HttpService } from '@nestjs/axios';
import {
    Controller,
    Get,
    Global,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
    Module,
    Scope,
    UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ConfigKey from '../config/config-key';
import jwt, { JwtHeader } from 'jsonwebtoken';
import { HttpConfigService } from './httpConfig.service';
import { AxiosInstance } from 'axios';
import { JwtGuard } from '../guards/jwt.guard';
import { SuccessResponse } from '../helpers/response';
import { ROUTER_PREFIX_CVM } from 'src/modules/common/common.constant';

interface IGetPublicJWTkeyResponse {
    keys: {
        kid: string;
        x5c: string[];
    }[];
}

interface IAuth0GetTokenResponse {
    access_token: string;
    scope: string;
    expires_in: number;
    token_type: string;
}

interface IAuth0AccessTokenData {
    accessToken: string;
    scope: string;
    expiresIn: number;
    expiresAt: number;
    tokenType: string;
}

@Injectable({ scope: Scope.DEFAULT })
export class Auth0Service {
    constructor(
        @Inject('winston') private readonly logger: Logger,
        private readonly configService: ConfigService,
        private httpService: HttpService,
    ) {
        this.client = httpService.axiosRef;
    }
    private client: AxiosInstance;
    private readonly domain = this.configService.get(ConfigKey.AUTH0_DOMAIN);
    private readonly audience = this.configService.get(
        ConfigKey.AUTH0_AUDIENCE,
    );
    private readonly cvmIamClientId = this.configService.get(
        ConfigKey.AUTH0_CVM_IAM_CLIENT_ID,
    );
    private readonly cvmIamClientSecret = this.configService.get(
        ConfigKey.AUTH0_CVM_IAM_CLIENT_SECRET,
    );
    private readonly postAccessTokenUrl = `https://${this.domain}/oauth/token`;
    private readonly getCertificateUrl = `https://${this.domain}/.well-known/jwks.json`;

    accessToken: IAuth0AccessTokenData = {
        accessToken: '',
        scope: '',
        expiresIn: 0,
        expiresAt: 0,
        tokenType: '',
    };

    async getAccessToken(): Promise<string> {
        try {
            if (this.accessToken.expiresAt > Date.now()) {
                return this.accessToken.accessToken;
            }
            const response = await this.client.post<IAuth0GetTokenResponse>(
                this.postAccessTokenUrl,
                {
                    client_id: this.cvmIamClientId,
                    client_secret: this.cvmIamClientSecret,
                    audience: this.audience,
                    grant_type: 'client_credentials',
                },
            );
            this.accessToken = {
                accessToken: response?.data?.access_token,
                scope: response?.data?.scope,
                expiresIn: response?.data?.expires_in,
                expiresAt: +response?.data?.expires_in + Date.now(),
                tokenType: response?.data?.token_type,
            };
            return this.accessToken.accessToken;
        } catch (error) {
            this.logger.error(
                `Error in ${Auth0Service.name} - getAccessToken func: `,
                error,
            );
            throw error;
        }
    }

    async verifyAccessToken(accessToken: string): Promise<boolean> {
        try {
            const { header } = jwt.decode(accessToken, {
                complete: true,
            }) as { header: JwtHeader };
            const certificate = await this.getCertificate(header);
            if (!certificate) return false;
            const result = jwt.verify(accessToken, certificate, {
                algorithms: [header.alg],
            }) as { exp: number; iss: string };
            if (!result) return false;
            if (result.exp > Date.now()) return false;
            if (result.iss !== `https://${this.domain}/`) return false;
            return true;
        } catch (error) {
            this.logger.error(
                `Error in ${Auth0Service.name} - verifyAccessToken func: `,
                error,
            );
            throw error;
        }
    }

    private async getCertificate(header: JwtHeader): Promise<string> {
        try {
            const response = await this.client.get<IGetPublicJWTkeyResponse>(
                this.getCertificateUrl,
            );
            const keys = response.data?.keys || [];
            for (const key of keys) {
                if (key.kid === header.kid) {
                    const certificate = `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
                    return certificate;
                }
            }
            return '';
        } catch (error) {
            this.logger.error(
                `Error in ${Auth0Service.name} - getCertificate func: `,
                error,
            );
            throw error;
        }
    }
}

// only using to testing the authentication between server to server
@Controller(`/${ROUTER_PREFIX_CVM}/auth0`)
@UseGuards(JwtGuard)
class Auth0Controller {
    constructor(private readonly auth0Service: Auth0Service) {
        // eslint-disable-next-line prettier/prettier
    }

    @Get('/access-token')
    async getAuth0AccessToken() {
        try {
            await this.auth0Service.getAccessToken();
            const data = this.auth0Service.accessToken;
            return new SuccessResponse(data);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}

@Global()
@Module({
    imports: [
        HttpModule.registerAsync({
            useClass: HttpConfigService,
        }),
    ],
    controllers: [Auth0Controller],
    providers: [Auth0Service],
    exports: [Auth0Service],
})
export class Auth0Module {}
