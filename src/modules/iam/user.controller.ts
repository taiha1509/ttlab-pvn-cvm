import {
    Controller,
    Get,
    InternalServerErrorException,
    Param,
    ParseIntPipe,
} from '@nestjs/common';
import { SuccessResponse } from 'src/common/helpers/response';
import { ROUTER_PREFIX_CVM } from '../common/common.constant';
import { UserCVMService } from './services/userCVM.service';

@Controller(`/${ROUTER_PREFIX_CVM}/user`)
export class UserCVMController {
    constructor(private readonly userCVMService: UserCVMService) {}

    @Get(':id')
    async getCameraAndGroupCameraByUserId(
        @Param('id', ParseIntPipe) userId: number,
    ) {
        try {
            const userInfo =
                await this.userCVMService.getCameraAndGroupCameraByUserId(
                    userId,
                );
            return new SuccessResponse(userInfo);
        } catch (error) {
            throw new InternalServerErrorException(error);
        }
    }
}
