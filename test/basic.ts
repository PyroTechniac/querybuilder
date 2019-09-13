import ava from 'ava';
import { QueryBuilder, DATATYPES, QueryBuilderType } from '../dist';
import { SchemaEntry } from 'klasa';
import { sharedSchema } from './lib/shared';

ava('constructor(no arguments)', (test): void => {
	const qb = new QueryBuilder();
	test.is(qb.size, DATATYPES.length, 'An empty QueryBuilder should have as many datatypes as defined by default.');
});

ava('basic(typeof)', (test): void => {
	test.plan(6);

	const qb = new QueryBuilder();
	const type = qb.get('string');

	// Check types
	test.is(typeof type, 'object', 'The returned value must be an object.');
	test.is(typeof type.array, 'function', 'QueryBuilderDataType#array must be a function.');
	test.is(typeof type.arraySerializer, 'function', 'QueryBuilderDataType#arraySerializer must be a function.');
	test.is(typeof type.extends, 'undefined', 'QueryBuilderDataType#extends must be undefined for types that do not extend.');
	test.is(typeof type.formatDatatype, 'function', 'QueryBuilderDataType#formatDatatype must be a function.');
	test.is(typeof type.type, 'function', 'QueryBuilderDataType#type must be a function.');
});

ava('basic(value check)', (test): void => {
	test.plan(8);

	const qb = new QueryBuilder();
	const type = qb.get('string');
	const getType = type.type as QueryBuilderType;
	const schemaEntry = sharedSchema.get('string19') as SchemaEntry;

	// Check values
	test.is(type.array(type.type as string), 'TEXT', 'By default, QueryBuilder stores arrays as TEXT.');
	test.is(type.arraySerializer(['339942739275677727'], schemaEntry, type.serializer), `'["339942739275677727"]'`, 'By default, arrays are stored as JSON.');
	test.is(type.serializer('339942739275677727', schemaEntry), `'339942739275677727'`, 'By default, non-object values are stringified and wrapped with single quotes.');
	test.is(getType(schemaEntry), 'VARCHAR(19)', 'The default value for the snowflake type is a VARCHAR(19).');
	test.is(type.formatDatatype('id', 'VARCHAR(19)', null), 'id VARCHAR(19)', 'Datatypes without default should consist of {name} {datatype}.');
	test.is(type.formatDatatype('id', 'VARCHAR(19)', "'339942739275677727'"), "id VARCHAR(19) NOT NULL DEFAULT '339942739275677727'",
		'Datatypes with default should not be nullable and have a default.');

	// SQL Injection
	test.is(type.serializer("' DROP TABLE 'users'; --", null), "''' DROP TABLE ''users''; --'", 'Serializer should protect against SQLi.');
	test.is(type.arraySerializer(["' DROP TABLE 'users'; --"], null, type.serializer), `'["'' DROP TABLE ''users''; --"]'`, 'SerializerArray should protect against SQLi.');
});

ava('basic(extends)', (test): void => {
	test.plan(10);

	const qb = new QueryBuilder();

	{
		const typeSnowflake = qb.get('snowflake');
		const typeChannel = qb.get('channel');

		test.is(typeSnowflake.type, 'VARCHAR(19)');
		test.is(typeSnowflake.extends, undefined);
		test.is(typeChannel.extends, 'snowflake');

		// Test inheritance
		test.is(typeChannel.array, typeSnowflake.array);
		test.is(typeChannel.arraySerializer, typeSnowflake.arraySerializer);
		test.is(typeChannel.formatDatatype, typeSnowflake.formatDatatype);
		test.is(typeChannel.serializer, typeSnowflake.serializer);
		test.is(typeChannel.type, typeSnowflake.type);
	}

	// Test patch inheritance
	qb.add('snowflake', { type: 'BIGINT' });
	{
		const typeSnowflake = qb.get('snowflake');
		const typeChannel = qb.get('channel');

		test.is(typeSnowflake.type, 'BIGINT');
		test.is(typeChannel.type, typeSnowflake.type);
	}
});
