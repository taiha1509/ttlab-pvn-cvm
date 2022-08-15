import { CameraRecordingConfiguration } from 'src/modules/camera/dto/type';
import Joi from 'src/plugins/joi';
import {
    PTZCommand,
    PTZValue,
    PTZValueByCommand,
} from '../../deviceController.constant';

export class ControlCameraPTZDto {
    command: PTZCommand;
    value: PTZValue;
}

export class Schedule {
    _id: string;
    startAt: Date;
    endAt: Date;
}

export class SchedulesData {
    schedules: Schedule[];
    recordingConfiguration: CameraRecordingConfiguration;
}

export const ControlCameraPTZSchema = Joi.object({
    command: Joi.string().valid(...Object.values(PTZCommand)),
    value: Joi.when('command', {
        switch: [
            {
                is: PTZCommand.PAN,
                then: Joi.string().valid(...PTZValueByCommand[PTZCommand.PAN]),
            },
            {
                is: PTZCommand.TILT,
                then: Joi.string().valid(...PTZValueByCommand[PTZCommand.TILT]),
            },
            {
                is: PTZCommand.ZOOM,
                then: Joi.string().valid(...PTZValueByCommand[PTZCommand.ZOOM]),
            },
        ],
    }),
});
