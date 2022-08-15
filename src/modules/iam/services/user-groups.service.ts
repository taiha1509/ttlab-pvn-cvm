import { Injectable, Scope } from '@nestjs/common';
import { AxiosService } from 'src/common/services/axios.service';
import { IGroupUserCVMResponse, IGroupUserResponse } from '../types';
import {
    IBodyResponse,
    IDataList,
} from 'src/common/interfaces/common.interfaces';

@Injectable({ scope: Scope.REQUEST })
export class UserGroupService extends AxiosService {
    baseUrl = 'user-group';
    async getGroupUsersList(ids: number[]): Promise<IGroupUserCVMResponse> {
        try {
            const response = (await this.getList({
                ids: ids,
            })) as IBodyResponse<IGroupUserCVMResponse>;
            return response?.success
                ? response?.data
                : {
                      items: [] as IGroupUserResponse[],
                      totalItems: 0,
                  };
        } catch (error) {
            throw error;
        }
    }

    async getListIdsInGroupTree(
        ids: number[],
    ): Promise<IBodyResponse<IDataList<number>>> {
        try {
            const response = (await this.client.get(
                `${this.baseUrl}/children-ids-in-tree`,
                {
                    params: { ids },
                },
            )) as IBodyResponse<IDataList<number>>;
            return response;
        } catch (error) {
            throw error;
        }
    }
}
