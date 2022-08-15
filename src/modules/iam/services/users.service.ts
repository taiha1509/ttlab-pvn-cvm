import { Injectable, Scope } from '@nestjs/common';
import { AxiosService } from 'src/common/services/axios.service';
import { IUserCVMResponse, IUserResponse } from '../types';
import { IBodyResponse } from 'src/common/interfaces/common.interfaces';

@Injectable({ scope: Scope.REQUEST })
export class IAMUserService extends AxiosService {
    baseUrl = 'user';
    async getUsersList(ids: number[]): Promise<IUserCVMResponse> {
        try {
            const response = (await this.client.get(this.baseUrl, {
                params: {
                    ids: ids,
                },
            })) as IBodyResponse<IUserCVMResponse>;
            return response?.success
                ? response?.data
                : {
                      items: [] as IUserResponse[],
                      totalItems: 0,
                  };
        } catch (error) {
            throw error;
        }
    }
}
