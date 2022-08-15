import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
    DEAULT_TIMEZONE,
    TIMEZONE_HEADER,
    DEFAULT_TIMEZONE_NAME,
    TIMEZONE_NAME_HEADER,
    ACCEPT_LANGUAGE_HEADER,
    DEFAULT_LANGUAGE,
} from '../constants';

@Injectable()
export class HeaderMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction) {
        if (!req.headers[TIMEZONE_HEADER]) {
            req.headers[TIMEZONE_HEADER] = DEAULT_TIMEZONE;
        }
        if (!req.headers[TIMEZONE_NAME_HEADER]) {
            req.headers[TIMEZONE_NAME_HEADER] = DEFAULT_TIMEZONE_NAME;
        }
        if (!req.headers[ACCEPT_LANGUAGE_HEADER]) {
            req.headers[ACCEPT_LANGUAGE_HEADER] = DEFAULT_LANGUAGE;
        }
        next();
    }
}
