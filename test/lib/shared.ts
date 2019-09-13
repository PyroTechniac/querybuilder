import { Schema } from 'klasa';
import { DATATYPES } from '../..';

export const sharedSchema = new Schema()
	.add('string19', 'string', { max: 19 })
	.add('integerLarge', 'integer', { max: 2 ** 40 });

for (const [key] of DATATYPES) {
	sharedSchema.add(key, key);
}
