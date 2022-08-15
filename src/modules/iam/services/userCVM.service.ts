import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Camera, CameraDocument } from '../../camera/schema/camera.schema';
import {
    CameraGroup,
    CameraGroupDocument,
} from '../../camera-group/schema/cameraGroup.schema';
const cameraDetailAttributes = ['_id', 'name'];
const groupCameraAttributes = ['_id', 'name'];

@Injectable()
export class UserCVMService {
    constructor(
        @InjectModel(Camera.name)
        private readonly cameraModel: Model<CameraDocument>,
        @InjectModel(CameraGroup.name)
        private readonly groupCameraModel: Model<CameraGroupDocument>,
    ) {}

    async getCameraAndGroupCameraByUserId(userId: number) {
        try {
            const cameras = await this.cameraModel
                .find({
                    userIds: { $elemMatch: { $eq: +userId } },
                    deletedAt: { $exists: true, $eq: null },
                })
                .lean(true)
                .select(cameraDetailAttributes)
                .exec();
            const cameraGroups = await this.groupCameraModel
                .find({
                    userIds: { $elemMatch: { $eq: +userId } },
                    deletedAt: { $exists: true, $eq: null },
                })
                .lean()
                .select(groupCameraAttributes)
                .exec();
            return {
                cameras: cameras,
                cameraGroups: cameraGroups,
            };
        } catch (error) {
            throw error;
        }
    }
}
