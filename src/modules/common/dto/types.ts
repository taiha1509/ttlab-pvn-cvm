export interface IMongoKeywordCondition {
    [key: string]: {
        $regex: string;
        $options: string;
    };
}
