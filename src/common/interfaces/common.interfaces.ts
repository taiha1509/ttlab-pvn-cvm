import { OrderBy, OrderDirection } from '../constants';
import { AxiosResponse } from 'axios';

export class CommonListQueryDto<OrderByT> {
    page: number;
    limit: number;
    name?: string;
    keyword?: string;
    orderDirection?: OrderDirection;
    orderBy?: OrderBy | OrderByT;
}

export interface IResponseError {
    key: string;
    errorCode: number;
    message: string;
    rule?: string;
    path?: string;
}

// Interfaces for general response of all apis
export interface IBodyResponse<T> extends AxiosResponse {
    success: boolean;
    isRequestError?: boolean;
    code: number;
    message: string;
    data: T;
    errors?: IResponseError[];
}

export class IDataList<T> {
    items: T[];
    totalItems: number;
}

export type QueryType =
    | string
    | number
    | number[]
    | string[]
    | Record<string, string | number>
    | Record<string, string | number>[];

export type BodyType = QueryType & Date;
