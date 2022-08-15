export class CameraDetailResponseDto {
    _id: string;
    uid: string;
    kinesisChannelARN: string;
    awsKey: {
        accessKey: string;
        secretAccessKey: string;
        region: string;
    };
}

export class CameraDetail {
    _id: string;
    uid: string;
    kinesisChannelARN: string;
}
