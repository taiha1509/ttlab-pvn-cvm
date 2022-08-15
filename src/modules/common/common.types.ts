import { ObjectId } from 'mongodb';
import { OrderDirection } from 'src/common/constants';

export class TreeNodeResponseDto {
    _id: ObjectId;
    name: string;
    level: number;
    children?: TreeNodeResponseDto[];
}

export class IBaseQueryList {
    limit?: number;
    page?: number;
    orderDirection?: OrderDirection;
    keyword?: string | null;
}
