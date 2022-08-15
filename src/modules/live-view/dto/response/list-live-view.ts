class LiveViewCameraInfo {
    _id: string;
    name: string;
    model: string;
    serialNumber: string;
    uid: string;
    channelName: string;
}

export class ListLiveViewResponseDto {
    items: LiveViewCameraInfo[];
    accessKey: string;
    region: string;
    accessKeyId: string;
    totalItems: number;
}
