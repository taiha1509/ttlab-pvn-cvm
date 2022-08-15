import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtGuard } from 'src/common/guards/jwt.guard';
import { FileController } from './file.controller';
import { fileSchema, File } from './schema/file.schema';
import { FileService } from './service/file.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: File.name, schema: fileSchema }]),
    ],
    controllers: [FileController],
    providers: [FileService, JwtGuard],
})
export class FileModule {
    //
}
