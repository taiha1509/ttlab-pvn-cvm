import { Prop } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { IDataList } from 'src/common/interfaces/common.interfaces';

export class CameraGroupDetailResponseDto {
    _id: ObjectId;
    name: string;
    level: number;
    children?: CameraGroupDetailResponseDto[];
    parentId?: ObjectId;
}

export class CameraGroupDetail {
    _id: ObjectId;
    userIds: number[];
    name: string;
    level: number;
    parentId?: ObjectId;
}

export class CameraGroupDetailDropdownResponseDto {
    _id: string;
    name: string;
}

export class CameraGroupListResponseDto extends IDataList<CameraGroupDetailResponseDto> {
    @Prop({ type: [CameraGroupDetailResponseDto] })
    items: CameraGroupDetailResponseDto[];
}
