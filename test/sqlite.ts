import ava from 'ava';
import { QueryBuilder, QueryBuilderType } from '../dist';
import { sharedSchema } from './lib/shared';
import { SchemaEntry } from 'klasa';

const qb = new QueryBuilder()
	.add('integer', { type: ({ max }) => max >= 2 ** 32 ? 'BIGINT' : 'INTEGER' })
	.add('float', { type: 'DOUBLE PRECISION' })
	.add('boolean', { type: 'TINYINT', serializer: (input) => input ? '1' : '0' });

ava('sqlite(primitive types)', (test): void => {
	test.plan(3);

	test.is(typeof qb.get('integer').type, 'function');
	test.is(qb.get('float').type, 'DOUBLE PRECISION');
	test.is(qb.get('boolean').type, 'TINYINT');
});

ava('sqlite(type:integer)', (test): void => {
	test.plan(6);

	const type = qb.get('integer');
	const getType = type.type as QueryBuilderType;
	const schemaEntry = sharedSchema.get('integer') as SchemaEntry;

	// Check values
	test.is(getType(schemaEntry), 'INTEGER');
	test.is(type.array(getType(schemaEntry)), 'TEXT');
	test.is(type.serializer(420, schemaEntry), '420');
	test.is(type.arraySerializer([420], schemaEntry, type.serializer), "'[420]'");
	test.is(type.formatDatatype('id', 'INTEGER', null), 'id INTEGER');
	test.is(type.formatDatatype('id', 'INTEGER', '420'), `id INTEGER NOT NULL DEFAULT 420`);
});

ava('sqlite(type:bigint)', (test): void => {
	test.plan(6);

	const type = qb.get('integer');
	const getType = type.type as QueryBuilderType;
	const schemaEntry = sharedSchema.get('integerLarge') as SchemaEntry;

	// Check values
	test.is(getType(schemaEntry), 'BIGINT');
	test.is(type.array(getType(schemaEntry)), 'TEXT');
	test.is(type.serializer(420, schemaEntry), '420');
	test.is(type.arraySerializer([420], schemaEntry, type.serializer), "'[420]'");
	test.is(type.formatDatatype('id', 'BIGINT', null), 'id BIGINT');
	test.is(type.formatDatatype('id', 'BIGINT', '420'), `id BIGINT NOT NULL DEFAULT 420`);
});

ava('sqlite(type:boolean)', (test): void => {
	test.plan(6);

	const type = qb.get('boolean');
	const getType = type.type as string;
	const schemaEntry = sharedSchema.get('boolean') as SchemaEntry;

	// Check values
	test.is(getType, 'TINYINT');
	test.is(type.array(getType), 'TEXT');
	test.is(type.serializer(false, schemaEntry), '0');
	test.is(type.arraySerializer([true, false], schemaEntry, type.serializer), "'[true,false]'");
	test.is(type.formatDatatype('id', 'TINYINT', null), 'id TINYINT');
	test.is(type.formatDatatype('id', 'TINYINT', '1'), `id TINYINT NOT NULL DEFAULT 1`);
});

ava('sqlite(type:string)', (test): void => {
	test.plan(7);

	const type = qb.get('string');
	const getType = type.type as QueryBuilderType;
	const schemaEntry = sharedSchema.get('string19') as SchemaEntry;

	// Check values
	test.is(type.array(getType(schemaEntry)), 'TEXT');
	test.is(type.serializer('339942739275677727', schemaEntry), "'339942739275677727'");
	test.is(type.arraySerializer(['339942739275677727'], schemaEntry, type.serializer), `'["339942739275677727"]'`);
	test.is(type.formatDatatype('id', 'VARCHAR(19)', null), 'id VARCHAR(19)');
	test.is(type.formatDatatype('id', 'VARCHAR(19)', "'339942739275677727'"), `id VARCHAR(19) NOT NULL DEFAULT '339942739275677727'`);

	// SQL Injection
	test.is(type.serializer("' DROP TABLE 'users'; --", null), "''' DROP TABLE ''users''; --'", 'Serializer should protect against SQLi.');
	test.is(type.arraySerializer(["' DROP TABLE 'users'; --"], null, type.serializer), `'["'' DROP TABLE ''users''; --"]'`, 'SerializerArray should protect against SQLi.');
});
