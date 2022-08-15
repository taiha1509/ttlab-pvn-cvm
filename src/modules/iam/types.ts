export interface IUserResponse {
    id: number;
    username: string;
}

export interface IUserCVMResponse {
    items: IUserResponse[];
    totalItems: number;
}

export interface IGroupUserResponse {
    id: number;
    name: string;
}

export interface IGroupUserCVMResponse {
    items: IGroupUserResponse[];
    totalItems: number;
}
