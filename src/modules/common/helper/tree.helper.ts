import { cloneDeep, compact, flatten, isArray, uniq } from 'lodash';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { MongoCollections } from 'src/common/constants';
import { TreeNodeResponseDto } from '../common.types';
import { vietnameseStringInclude } from './helper';
export const subGroupAttributes = ['_id', 'name', 'level'];

/*
function to find leaf depends on node and level of node
input: level, nodeId
output: array of leaf
example: input: 1, 21313ddaadf332f2f
output: [{
    _id: lslakslad2131d1d1,
    level: 2
    children: [...],
    parentId: 21313ddaadf332f2f
}, ...]
*/
export async function findAllChildren(
    treeModel,
    parentId?: ObjectId,
    attrs = subGroupAttributes,
) {
    const condition = {
        deletedAt: { $exists: true, $eq: null },
        parentId: parentId || { $eq: null },
    } as any;
    const subGroupList = await treeModel.find(
        {
            $and: [condition],
        },
        attrs,
    );
    return subGroupList;
}

/*
function to check if name of node and its leaves contains keyword
input: level, name
output: boolean
example input: 3, group 1
output: true
*/
async function checkNodeContainsKeyword(
    id: string,
    keyword: string,
    treeModel,
): Promise<boolean> {
    try {
        const subGroupList = await treeModel.aggregate([
            {
                $match: {
                    _id: new ObjectId(id),
                    deletedAt: { $exists: true, $eq: null },
                },
            },
            {
                $graphLookup: {
                    from: MongoCollections.CAMERA_GROUPS,
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'parentId',
                    as: 'children',
                },
            },
        ]);
        let nameSubgroups = [];
        nameSubgroups = subGroupList[0].children.map((ele) => ele.name);
        nameSubgroups.push(subGroupList[0].name);
        const isContainGroup = nameSubgroups.some((ele) =>
            vietnameseStringInclude(ele, keyword),
        );
        return isContainGroup;
    } catch (error) {
        throw error;
    }
}

/*
function to build a tree
input: subGroup: group information, level, keyword: query name
output
tree {
    _id: string,
    name: string,
    level: number,
    children: [...]
}
*/

export async function buildATree(
    node: TreeNodeResponseDto,
    level: number,
    keyword: string,
    treeModel,
) {
    const tree = {
        _id: node._id,
        children: [],
        name: node.name,
        level: node.level,
    };
    // find children
    const listSubTree = await findAllChildren(treeModel, node._id);
    for (let i = 0; i < listSubTree.length; i++) {
        // find all children contains
        const isContainGroup = await checkNodeContainsKeyword(
            listSubTree[i]._id,
            keyword,
            treeModel,
        );
        if (isContainGroup) {
            const subNode = cloneDeep(
                await buildATree(listSubTree[i], level + 1, keyword, treeModel),
            );
            tree.children.push(subNode);
        }
    }
    return tree;
}

/*
function to build group of tree
input: keyword: query name
output
[{
    _id: string,
    name: string,
    level: number,
    children: [...]
}]
*/
export async function buildTreeGroups(query, treeModel) {
    // Find all root
    const firstLevelGroup = await findAllChildren(treeModel);
    const treeList = [];
    for (let i = 0; i < firstLevelGroup.length; i++) {
        const isContainsKeyword = await checkNodeContainsKeyword(
            firstLevelGroup[i]._id,
            query.keyword ? query.keyword : '',
            treeModel,
        );
        if (isContainsKeyword) {
            // build tree from level 2
            const tree = await buildATree(
                firstLevelGroup[i],
                2,
                query.keyword ? query.keyword : '',
                treeModel,
            );
            treeList.push(tree);
        }
        continue;
    }
    return treeList;
}
