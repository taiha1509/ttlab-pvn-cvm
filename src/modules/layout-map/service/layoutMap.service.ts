import { Model } from 'mongoose';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LayoutMap, LayoutMapDocument } from '../schema/layoutMap.schema';
import {
    CameraGroup,
    CameraGroupDocument,
} from 'src/modules/camera-group/schema/cameraGroup.schema';
import { CreateLayoutMapDto } from '../dto/request/create-layout-map.dto';
import {
    Camera,
    CameraDocument,
} from 'src/modules/camera/schema/camera.schema';
import { ObjectId } from 'mongodb';
import { UpdateLayoutMapDto } from '../dto/request/update-layout-map.dto';

@Injectable()
export class LayoutMapService {
    constructor(
        @Inject('winston') private readonly logger: Logger,
        @InjectModel(LayoutMap.name)
        private layoutMapModel: Model<LayoutMapDocument>,
        @InjectModel(CameraGroup.name)
        private cameraGroupModel: Model<CameraGroupDocument>,
        @InjectModel(Camera.name)
        private cameraModel: Model<CameraDocument>,
    ) {
        //
    }

    async getLayoutMapDetail(field: string, value: string) {
        try {
            const layoutMap = await this.layoutMapModel.findOne(
                {
                    [field]: value,
                    deletedAt: null,
                },
                null,
                {
                    lean: true,
                    populate: [
                        {
                            path: 'cameraGroup',
                            select: ['_id', 'name'],
                        },
                        {
                            path: 'cameraCoordinates.camera',
                            select: ['_id', 'name', 'serialNumber'],
                        },
                    ],
                },
            );
            if (!layoutMap) return layoutMap;
            if (layoutMap.file?.fileName) {
                layoutMap.file.url = encodeURI(
                    `${process.env.AWS_S3_DOMAIN}/${layoutMap.file.fileName}`,
                );
            }
            layoutMap.cameraGroupId =
                (layoutMap?.cameraGroup as CameraGroupDocument)?._id || null;

            if (layoutMap.cameraCoordinates?.length) {
                layoutMap.cameraCoordinates.forEach((cameraCoordinate) => {
                    cameraCoordinate.cameraId =
                        (cameraCoordinate?.camera as CameraDocument)?._id ||
                        null;
                    (cameraCoordinate.camera as CameraDocument).cameraGroupIds =
                        [layoutMap.cameraGroupId] as string[];
                });
            }
            return layoutMap;
        } catch (error) {
            this.logger.error('Error in getLayoutMapDetail func:', error);
            throw error;
        }
    }

    async checkLayoutMapExistByField(
        field: string,
        value: string,
        ignoredId?: string,
    ) {
        try {
            const conditions = { [field]: value, deletedAt: null };
            if (ignoredId?.length)
                Object.assign(conditions, { _id: { $ne: ignoredId } });
            const layoutMapCount = await this.layoutMapModel
                .count(conditions)
                .collation({ locale: 'en', strength: 2 });
            return layoutMapCount > 0;
        } catch (error) {
            this.logger.error(
                'Error in checkLayoutMapExistByField func:',
                error,
            );
            throw error;
        }
    }

    async checkCameraGroupExistByField(field: string, value: string) {
        try {
            const cameraGroupCount = await this.cameraGroupModel.count({
                [field]: value,
                deletedAt: null,
            });
            return cameraGroupCount > 0;
        } catch (error) {
            this.logger.error(
                'Error in checkCameraGroupExistByField func:',
                error,
            );
            throw error;
        }
    }

    /**
     * checking provided cameraIds whether exist and are in the same a group
     */
    async checkValidCameras(cameraIds: string[], cameraGroupIds: string) {
        try {
            const cameraCount = await this.cameraModel.count({
                _id: { $in: cameraIds },
                cameraGroups: cameraGroupIds,
                deletedAt: null,
            });
            return cameraCount === cameraIds.length;
        } catch (error) {
            this.logger.error('Error in checkValidCameras func:', error);
            throw error;
        }
    }

    async createLayoutMap(data: CreateLayoutMapDto) {
        try {
            const layoutMapModel = new this.layoutMapModel(data);
            await layoutMapModel.save();
            const layoutMap = this.getLayoutMapDetail(
                '_id',
                layoutMapModel._id,
            );
            return layoutMap;
        } catch (error) {
            this.logger.error('Error in createLayoutMap func:', error);
            throw error;
        }
    }

    async updateLayoutMap(_id: string, data: UpdateLayoutMapDto) {
        try {
            await this.layoutMapModel.updateOne(
                { _id },
                data as LayoutMapDocument,
            );
            const result = await this.getLayoutMapDetail('_id', _id);
            return result;
        } catch (error) {
            this.logger.error('Error in updateLayoutMap func:', error);
            throw error;
        }
    }

    async deleteCameraInLayoutMap(id: string) {
        try {
            const layoutMapInfo = await this.layoutMapModel.find({
                cameraCoordinates: {
                    $elemMatch: { camera: new ObjectId(id) },
                },
            });
            if (layoutMapInfo.length > 0) {
                layoutMapInfo.forEach(async (layoutMap) => {
                    const index = layoutMap.cameraCoordinates?.findIndex(
                        (ele) => ele.camera === id,
                    );
                    if (index > -1) layoutMap.cameraCoordinates?.splice(index);
                    await this.layoutMapModel.findByIdAndUpdate(
                        layoutMap._id,
                        layoutMap,
                    );
                });
            }
        } catch (error) {
            this.logger.debug('Error in delete camera in layout map', error);
            throw error;
        }
    }

    async deleteLayoutMap(id: string, deletedBy: number) {
        try {
            await this.layoutMapModel.updateOne(
                { _id: id.toString() },
                {
                    deletedBy,
                    deletedAt: new Date(),
                },
            );
        } catch (error) {
            this.logger.error('Error in deleteLayoutMap func:', error);
            throw error;
        }
    }
}
