import { HttpService } from '@nestjs/axios';
import { AxiosInstance, AxiosPromise, AxiosResponse } from 'axios';
import {
    IBodyResponse,
    IDataList,
} from 'src/common/interfaces/common.interfaces';
import { Inject, Injectable } from '@nestjs/common';
import {
    DEFAULT_LANGUAGE,
    DEAULT_TIMEZONE,
    TIMEZONE_HEADER,
    TIMEZONE_NAME_HEADER,
    DEFAULT_TIMEZONE_NAME,
} from '../constants';
import { Request } from 'express';
import { Auth0Service } from './auth0.service';

import axios, { AxiosRequestConfig } from 'axios';
import { REQUEST } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import ConfigKey from '../config/config-key';
import { IBaseQueryList } from 'src/modules/common/common.types';

@Injectable()
export class AxiosService extends HttpService {
    client: AxiosInstance;
    baseUrl: string;

    constructor(
        @Inject(REQUEST) request: Request,
        auth0Service: Auth0Service,
        configService: ConfigService,
    ) {
        const instance = axios.create({
            baseURL: configService.get(ConfigKey.IAM_API_URL),
            responseType: 'json',
        });
        instance.interceptors.request.use(
            async (config: AxiosRequestConfig) => {
                const accessToken =
                    (await auth0Service?.getAccessToken()) || '';
                Object.assign(config, {
                    headers: {
                        ...config.headers,
                        Authorization: `Bearer ${accessToken}`,
                        'accept-language':
                            request.headers?.['accept-language'] ||
                            DEFAULT_LANGUAGE,
                        'Content-Type': 'application/json',
                        [TIMEZONE_HEADER]:
                            request.headers?.[TIMEZONE_HEADER] ||
                            DEAULT_TIMEZONE,
                        [TIMEZONE_NAME_HEADER]:
                            request.headers?.[TIMEZONE_NAME_HEADER] ||
                            DEFAULT_TIMEZONE_NAME,
                    },
                });
                return config;
            },
        );
        instance.interceptors.response.use(
            (response: AxiosResponse) => {
                if (typeof response?.data === 'string')
                    response.data = JSON.parse(response.data);
                if (response?.data) response.data.success = true;
                return response?.data || {};
            },
            async (error) => {
                if (error.response) {
                    if (typeof error?.response?.data === 'string') {
                        error.response.data = JSON.parse(error.response.data);
                    }
                    if (error?.response?.data)
                        error.response.data = {
                            ...(error?.response?.data || {}),
                            success: false,
                        };
                    return error?.response?.data || {};
                } else if (error.request) {
                    if (error.request.data)
                        error.request.data = {
                            ...(error?.request?.data || {}),
                            success: false,
                            isRequestError: true,
                            message: error.message,
                        };
                    return error?.request?.data || {};
                }
                throw error;
            },
        );
        super(instance);
        this.client = instance;
    }

    get detailUrl(): string {
        return this.baseUrl;
    }

    get createUrl(): string {
        return this.baseUrl;
    }

    get updateUrl(): string {
        return this.baseUrl;
    }

    get deleteUrl(): string {
        return this.baseUrl;
    }

    useClient(axios: AxiosInstance): void {
        this.client = axios;
    }

    beforeCreate<P>(params: P): P {
        return params;
    }

    beforeUpdate<P>(params: P): P {
        return params;
    }

    beforeSave<P>(params: P): P {
        return params;
    }

    getList<P, R extends IBodyResponse<IDataList<R>>>(
        params: P | IBaseQueryList,
    ): AxiosPromise {
        return this.client.get<R, R>(this.baseUrl, { params });
    }

    getDetail<R extends IBodyResponse<IDataList<R>>>(
        id: number | string,
    ): AxiosPromise {
        return this.client.get<R, R>(this.detailUrl + '/' + id);
    }
}
