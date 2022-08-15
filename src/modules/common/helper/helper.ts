import { IMongoKeywordCondition } from '../dto/types';

export function removeAccents(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}
export function vietnameseStringInclude(str: string, keyword: string): boolean {
    return removeAccents(str.toLowerCase()).includes(
        removeAccents(keyword.toLowerCase()),
    );
}

/**
 *
 * @param fields in db will be searched
 * @param keyword will be matched
 * @param option of regex (default i: Case insensitivity to match upper and lower cases)
 * @returns conditions by an array which used in query ($or/$and)
 */
export function getMongoKeywordConditions(
    fields: string[],
    keyword = '',
    option = 'i',
): IMongoKeywordCondition[] {
    return fields.reduce((conditions, field) => {
        const condition = { [field]: { $regex: keyword, $options: option } };
        conditions.push(condition);
        return conditions;
    }, []);
}
