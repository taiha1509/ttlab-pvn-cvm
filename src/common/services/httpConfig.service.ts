import { HttpModuleOptions, HttpModuleOptionsFactory } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ConfigKey from '../config/config-key';

@Injectable()
export class HttpConfigService implements HttpModuleOptionsFactory {
    constructor(private readonly configService: ConfigService) {}
    createHttpOptions(): HttpModuleOptions {
        return {
            timeout: this.configService.get(ConfigKey.HTTP_TIMEOUT) || 5000,
            maxRedirects:
                this.configService.get(ConfigKey.HTTP_MAX_REDIRECTS) || 5,
            baseURL: this.configService.get(ConfigKey.IAM_API_URL),
        };
    }
}
