import { Injectable } from '@nestjs/common';
import { HttpStatus } from 'src/common/constants';

const { VERSION: version = '' } = process.env;

const DEFAULT_SUCCESS_MESSAGE = 'success';

export interface IErrorResponse {
    key: string;
    errorCode: number;
    message: string;
}

export class SuccessResponse {
    constructor(data = {}) {
        return {
            code: HttpStatus.OK,
            message: DEFAULT_SUCCESS_MESSAGE,
            data,
            version,
        };
    }
}
export class ErrorResponse {
    constructor(
        code = HttpStatus.INTERNAL_SERVER_ERROR,
        message = '',
        errors: IErrorResponse[] = [],
    ) {
        return {
            code,
            message,
            errors,
            version,
        };
    }
}

@Injectable()
export class ApiResponse<T> {
    public code: number;

    public message: string;

    public data: T;

    public errors: IErrorResponse[];
}
