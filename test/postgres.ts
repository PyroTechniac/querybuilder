import ava from 'ava';
import { QueryBuilder, QueryBuilderType } from '../dist';
import { sharedSchema } from './lib/shared';
import { SchemaEntry } from 'klasa';

const qb = new QueryBuilder({
	array: (type): string => `${type}[]`,
	arraySerializer: (values, piece, resolver): string =>
		values.length ? `array[${values.map((value) => resolver(value, piece)).join(', ')}]` : "'{}'",
	formatDatatype: (name, datatype, def = null): string => `"${name}" ${datatype}${def !== null ? ` NOT NULL DEFAULT ${def}` : ''}`
})
	.add('boolean', { type: 'BOOL' })
	.add('integer', { type: ({ max }) => max >= 2 ** 32 ? 'BIGINT' : 'INTEGER' })
	.add('float', { type: 'DOUBLE PRECISION' })
	.add('uuid', { type: 'UUID' })
	.add('any', { type: 'JSON', serializer: (input) => `'${JSON.stringify(input)}'::json` })
	.add('json', { extends: 'any' });

ava('postgres(primitive types)', (test): void => {
	test.plan(6);

	test.is(qb.get('boolean').type, 'BOOL');
	test.is(typeof qb.get('integer').type, 'function');
	test.is(qb.get('float').type, 'DOUBLE PRECISION');
	test.is(qb.get('uuid').type, 'UUID');
	test.is(qb.get('any').type, 'JSON');
	test.is(qb.get('json').type, 'JSON');
});

ava('postgres(advanced types)', (test): void => {
	test.plan(7);

	const type = qb.get('string');
	const getType = type.type as QueryBuilderType;
	const schemaEntry = sharedSchema.get('string19') as SchemaEntry;

	// Check values
	test.is(type.array(getType(schemaEntry)), 'VARCHAR(19)[]');
	test.is(type.serializer('339942739275677727', schemaEntry), "'339942739275677727'");
	test.is(type.arraySerializer(['339942739275677727'], schemaEntry, type.serializer), "array['339942739275677727']");
	test.is(type.formatDatatype('id', 'VARCHAR(19)', null), '"id" VARCHAR(19)');
	test.is(type.formatDatatype('id', 'VARCHAR(19)', "'339942739275677727'"), `"id" VARCHAR(19) NOT NULL DEFAULT '339942739275677727'`);

	// SQL Injection
	test.is(type.serializer("' DROP TABLE 'users'; --", null), "''' DROP TABLE ''users''; --'", 'Serializer should protect against SQLi.');
	test.is(type.arraySerializer(["' DROP TABLE 'users'; --"], null, type.serializer), `array[''' DROP TABLE ''users''; --']`, 'SerializerArray should protect against SQLi.');
});
