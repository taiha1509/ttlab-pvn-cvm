import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';
import { UserGroupService } from 'src/modules/iam/services/user-groups.service';

/**
 * this guard is use to add list user group ids that is descendant of
 * one or more user group nodes (which are assigned for login user)
 */
@Injectable()
export class SetTreeUserGroupIdsGuard implements CanActivate {
    constructor(
        private readonly i18n: I18nRequestScopeService,
        private readonly configService: ConfigService,
        private readonly userGroupIAMService: UserGroupService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const userId = request.loginUser?.id;
        const userGroupIds = (request.loginUser?.groups || []).map(
            (group) => group.id,
        ) as number[];
        let treeUserGroupIds = [];
        if (userGroupIds.length > 0) {
            treeUserGroupIds =
                (
                    await this.userGroupIAMService.getListIdsInGroupTree(
                        userGroupIds,
                    )
                )?.data?.items || [];
        }

        // map to request
        request.loginUser.treeUserGroupIds = treeUserGroupIds;
        return true;
    }
}
