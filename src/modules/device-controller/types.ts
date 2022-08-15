export interface ISocketWepAppLogin {
    senderId: number;
    senderUsername: string;
    senderEmail: string | null;
}

export interface ISocketOnvifRequestBody {
    cameraUid: string;
    cameraUsername: string;
    cameraPassword: string;
    clientSocketRoom: string;
}
