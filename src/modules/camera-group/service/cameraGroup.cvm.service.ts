import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DEFAULT_LIMIT_FOR_DROPDOWN } from 'src/common/constants';
import { CameraGroupDetailDropdownResponseDto } from '../dto/response/list-cameraGroup.dto';
import { CameraGroup, CameraGroupDocument } from '../schema/cameraGroup.schema';
import { ObjectId } from 'mongodb';
import { IDataList } from 'src/common/interfaces/common.interfaces';
export const cameraDetailAttributes = [
    '_id',
    'name',
    'model',
    'serialNumber',
    'uid',
    'cameraGroup',
    'userGroupIds',
    'userIds',
    'kinesisChannelARN',
];

@Injectable()
export class CameraGroupCVMService {
    constructor(
        @InjectModel(CameraGroup.name)
        private cameraGroupModel: Model<CameraGroupDocument>,
    ) {}

    async getGroupCameraListByIds(
        ids: string[],
        attrs = ['_id', 'name'],
    ): Promise<IDataList<CameraGroupDetailDropdownResponseDto>> {
        try {
            const condition = {
                deletedAt: { $exists: true, $eq: null },
            };
            if (ids)
                Object.assign(condition, {
                    _id: { $in: ids.map((id) => new ObjectId(id)) },
                });
            const [cameraGroups, totalItems] = await Promise.all([
                this.cameraGroupModel
                    .find(
                        {
                            $and: [condition],
                        },
                        attrs,
                    )
                    .limit(DEFAULT_LIMIT_FOR_DROPDOWN),
                this.cameraGroupModel.count({
                    $and: [condition],
                }),
            ]);
            return {
                items: cameraGroups,
                totalItems,
            };
        } catch (error) {
            throw error;
        }
    }

    async updateCamerasGroupUserIds(
        id: string,
        userId: number,
    ): Promise<CameraGroup> {
        try {
            const camera = await this.cameraGroupModel.findOne({
                _id: new Object(id),
            });
            camera?.userIds.push(userId);
            await this.cameraGroupModel.findByIdAndUpdate(camera._id, camera);
            return camera;
        } catch (error) {
            throw error;
        }
    }

    async removeAllUsersInCamera(userId: number) {
        try {
            const cameras = await this.cameraGroupModel
                .find({
                    userIds: { $elemMatch: { $eq: +userId } },
                })
                .select(cameraDetailAttributes);
            cameras.forEach(async (camera) => {
                const index = camera?.userIds.indexOf(+userId);
                if (index > -1) camera?.userIds.splice(index, 1);
                await this.cameraGroupModel.findByIdAndUpdate(
                    camera._id,
                    camera,
                );
            });
        } catch (error) {
            throw error;
        }
    }
}
