import { Injectable, PipeTransform } from '@nestjs/common';
import { isPlainObject, mapKeys, trim } from 'lodash';
import { BodyType } from '../interfaces/common.interfaces';

@Injectable()
export class TrimBodyData implements PipeTransform {
    constructor() {
        //
    }

    trimData(body: BodyType): void {
        const trimValue = (item: any) => {
            mapKeys(item, (value, key) => {
                // remove string contain only space characters
                if (typeof value === 'string') {
                    item[key] = value.trim();
                }

                // iterate array
                else if (Array.isArray(value)) {
                    value.forEach((subValue, index) => {
                        // remove string contain only space characters
                        if (
                            typeof subValue === 'string' &&
                            !trim(subValue as string)
                        ) {
                            value.splice(index, 1);
                        } else if (isPlainObject(subValue)) {
                            trimValue(subValue);
                        }
                    });
                } else if (isPlainObject(value)) {
                    trimValue(value);
                }
            });
        };

        trimValue(body);
    }

    transform(body: BodyType) {
        this.trimData(body);
        return body;
    }
}
