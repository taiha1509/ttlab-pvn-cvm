import { CameraGroup } from 'src/modules/camera-group/schema/cameraGroup.schema';
import { IGroupUserResponse, IUserResponse } from 'src/modules/iam/types';
import { IDataList } from 'src/common/interfaces/common.interfaces';

export class CameraDetailResponseDto {
    _id: string;
    name: string;
    serialNumber: string;
    uid: string;
    model: string;
    kinesisChannelARN: string;
    cameraGroups: string[] | null | CameraGroup[];
    userGroupIds: number[] | null;
    userIds: number[] | null;
    groupUserInfo?: IGroupUserResponse[];
    usersInfo?: IUserResponse[];
    password: string;
    onvifProfile?: Record<string, unknown> | null;
    userName?: string | null;
}

class CameraDetailInListResponseDto {
    _id: string;
    name: string;
    serialNumber: string;
    uid: string;
    model: string;
}

export class CameraListResponseDto extends IDataList<CameraDetailInListResponseDto> {
    items: CameraDetailInListResponseDto[];
}

export class CVMCameraDetailResponseDto {
    _id: string;
    name: string;
}
