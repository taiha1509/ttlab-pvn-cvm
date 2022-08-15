import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_LIMIT_FOR_DROPDOWN } from 'src/common/constants';
import { CVMCameraDetailResponseDto } from '../dto/response/detail.dto';
import { Camera, CameraDocument } from '../schema/camera.schema';
import { ObjectId } from 'mongodb';
import { IDataList } from 'src/common/interfaces/common.interfaces';
export const cameraDetailAttributes = [
    '_id',
    'name',
    'cameraGroups',
    'userGroupIds',
    'userIds',
    'connectionStatus',
];

@Injectable()
export class CameraMongoCVMService {
    constructor(
        @InjectModel(Camera.name) private cameraModel: Model<CameraDocument>,
        private readonly configService: ConfigService,
    ) {
        //
    }

    async updateCamerasUserIds(id: string, userId: number): Promise<Camera> {
        try {
            const camera = await this.cameraModel.findOne({
                _id: new Object(id),
                deletedAt: { $exists: true, $eq: null },
            });
            camera.userIds.push(userId);
            await this.cameraModel.findByIdAndUpdate(camera._id, camera);
            return camera;
        } catch (error) {
            throw error;
        }
    }

    async updateCamerasGroupUserIds(
        id: string,
        userId: number,
    ): Promise<Camera> {
        try {
            const camera = await this.cameraModel.findOne({
                _id: new ObjectId(id),
                deletedAt: { $exists: true, $eq: null },
            });
            camera.userGroupIds.push(userId);
            await this.cameraModel.findByIdAndUpdate(camera._id, camera);
            return camera;
        } catch (error) {
            throw error;
        }
    }

    async removeAllUsersInCamera(userId: number) {
        try {
            const cameras = await this.cameraModel
                .find({
                    userIds: { $elemMatch: { $eq: +userId } },
                    deletedAt: { $exists: true, $eq: null },
                })
                .select(cameraDetailAttributes);
            cameras.forEach(async (camera) => {
                const index = camera?.userIds.indexOf(+userId);
                if (index > -1) camera?.userIds.splice(index, 1);
                await this.cameraModel.findByIdAndUpdate(camera._id, camera);
            });
        } catch (error) {
            throw error;
        }
    }

    async removeAllGroupUsersInCamera(userGroupId: number) {
        try {
            const cameras = await this.cameraModel
                .find({
                    userGroupIds: { $elemMatch: { $eq: +userGroupId } },
                    deletedAt: { $exists: true, $eq: null },
                })
                .select(cameraDetailAttributes);
            cameras.forEach(async (camera) => {
                const index = camera?.userGroupIds.indexOf(+userGroupId);
                if (index > -1) camera?.userGroupIds.splice(index, 1);
                await this.cameraModel.findByIdAndUpdate(camera._id, camera);
            });
        } catch (error) {
            throw error;
        }
    }

    async getCameraListByIds(
        ids: string[],
        attrs = ['_id', 'name'],
    ): Promise<IDataList<CVMCameraDetailResponseDto>> {
        try {
            const condition = {
                deletedAt: { $exists: true, $eq: null },
            };
            if (ids)
                Object.assign(condition, {
                    _id: { $in: ids.map((id) => new ObjectId(id)) },
                });
            const [cameras, totalItems] = await Promise.all([
                this.cameraModel
                    .find(
                        {
                            $and: [condition],
                        },
                        attrs,
                    )
                    .limit(DEFAULT_LIMIT_FOR_DROPDOWN),
                this.cameraModel.count({
                    $and: [condition],
                }),
            ]);
            return {
                items: cameras,
                totalItems,
            };
        } catch (error) {
            throw error;
        }
    }
}
