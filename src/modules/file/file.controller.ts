import {
    Controller,
    Get,
    Post,
    Body,
    InternalServerErrorException,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { JoiValidationPipe } from 'src/common/pipes/joi.validation.pipe';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { ROUTER_PREFIX_APP } from 'src/modules/common/common.constant';
import { HttpStatus } from 'src/common/constants';
import {
    CreateFileDto,
    CreateFileSchema,
    PresignedUrlQueryDto,
    PresignedUrlQuerySchema,
} from './dto/request/create-file.dto';
import { FileService } from './service/file.service';
import { ErrorResponse, SuccessResponse } from 'src/common/helpers/response';
import { TrimBodyData } from 'src/common/pipes/trim.body.data.pipe';

@Controller(`/${ROUTER_PREFIX_APP}/file`)
@UseGuards(JwtGuard)
export class FileController {
    constructor(
        private readonly configService: ConfigService,
        private readonly i18n: I18nRequestScopeService,
        private readonly fileService: FileService,
        private readonly jwtService: JwtGuard,
    ) {
        //
    }

    @Get('presigned-url')
    async getPresignedUrl(
        @Query(new JoiValidationPipe(PresignedUrlQuerySchema))
        query: PresignedUrlQueryDto,
    ) {
        try {
            const result = await this.fileService.getS3PresignedUrl(
                query.path,
                query.originalName,
            );
            return new SuccessResponse(result);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }

    @Post()
    async createFile(
        @Req() req,
        @Body(new JoiValidationPipe(CreateFileSchema), new TrimBodyData())
        body: CreateFileDto,
    ) {
        try {
            const { loginUser } = req;
            const s3ExistFile = await this.fileService.checkS3ExistFile(
                body.fileName,
            );
            if (!s3ExistFile || body.fileName.indexOf(body.path) !== 0) {
                return new ErrorResponse(
                    HttpStatus.ITEM_NOT_FOUND,
                    await this.i18n.translate(
                        'fileUpload.error.invalidFileName',
                    ),
                );
            }
            const file = await this.fileService.createFile({
                ...body,
                createdBy: loginUser.id,
            });
            return new SuccessResponse(file);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
