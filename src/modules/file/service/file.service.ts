import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FileDocument, File } from '../schema/file.schema';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';
import { MODULE_NAME, PRESIGNED_URL_EXPIRED_IN } from '../file.constants';
import { createWinstonLogger } from 'src/common/services/winston.service';
import { IFileModel } from '../dto/types';
import ConfigKey from 'src/common/config/config-key';

@Injectable()
export class FileService {
    constructor(
        private readonly configService: ConfigService,
        @InjectModel(File.name) private fileModel: Model<FileDocument>,
    ) {
        //
    }

    private readonly logger = createWinstonLogger(
        MODULE_NAME,
        this.configService,
    );
    private S3Instance = new AWS.S3({
        accessKeyId: process.env[ConfigKey.AWS_ACCESS_KEY_ID],
        secretAccessKey: process.env[ConfigKey.AWS_SECRET_ACCESS_KEY],
        region: process.env[ConfigKey.AWS_REGION],
        signatureVersion: 'v4',
    });
    private readonly bucketName = process.env.AWS_S3_BUCKET;

    async getS3PresignedUrl(path: string, originalName: string) {
        try {
            const fileName = path
                ? `${path}/${uuidv4()}_${originalName}`
                : `${uuidv4()}_${originalName}`;
            const presignedUrl = this.S3Instance.getSignedUrl('putObject', {
                Bucket: this.bucketName,
                Key: fileName,
                Expires: PRESIGNED_URL_EXPIRED_IN,
                ACL: 'public-read',
            });
            return {
                path,
                originalName,
                fileName,
                presignedUrl,
            };
        } catch (error) {
            this.logger.error('Error in getS3PresignedUrl func: ', error);
            throw error;
        }
    }

    async checkS3ExistFile(fileName: string): Promise<boolean> {
        try {
            return await new Promise((resolve) => {
                this.S3Instance.headObject(
                    { Bucket: this.bucketName, Key: fileName },
                    (error) => {
                        if (error) return resolve(false);
                        resolve(true);
                    },
                );
            });
        } catch (error) {
            this.logger.error('Error in checkS3ExistFile func: ', error);
            throw error;
        }
    }

    async createFile(createFileDto: IFileModel) {
        try {
            const fileModel = new this.fileModel(createFileDto);
            await fileModel.save();
            const file = await this.getFileById(fileModel._id);
            return file;
        } catch (error) {
            this.logger.error('Error in createFile func: ', error);
            throw error;
        }
    }

    async getFileById(id: string) {
        try {
            const file = await this.fileModel.findById(id, null, {
                lean: true,
            });
            Object.assign(file, {
                url: encodeURI(`${process.env.AWS_S3_DOMAIN}/${file.fileName}`),
            });
            return file;
        } catch (error) {
            this.logger.error('Error in getFileById func: ', error);
            throw error;
        }
    }
}
