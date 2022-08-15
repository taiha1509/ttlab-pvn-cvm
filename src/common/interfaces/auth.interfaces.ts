import { PermissionActions, PermissionResources } from '../constants';

export enum ActiveTypes {
    EMAIL = 'email',
    PHONE = 'phone',
    USERNAME = 'username',
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    REGISTERING = 'registering',
}

export interface IPermission {
    id: number;
    action: {
        id: number;
        content: PermissionActions;
    };
    resource: {
        id: number;
        content: PermissionResources;
    };
}

export enum UserTypes {
    SYSTEM_ADMIN = 'system_admin',
    DEVICE_ADMIN = 'device_admin',
}

export interface IRole {
    id: number;
    name: string;
    description: string;
    permissions: IPermission[];
}
export interface IUserGroup {
    id: number;
    name: string;
    parentId: number;
    level: number;
}

export interface ILoginUserTokenInfo {
    token: string;
    expiredIn: number;
}

export interface ILoginUser {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    activeTypes: ActiveTypes;
    status: UserStatus;
    username: string;
    types: [UserTypes] | [];
    roles: IRole[];
    groups: IUserGroup[];
    treeUserGroupIds?: number[];
}
