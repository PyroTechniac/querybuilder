import { isObject } from './util';
import { QueryBuilderEntryOptions, QueryBuilderDatatype } from '../QueryBuilder';

export const DATATYPES: [string, QueryBuilderDatatype][] = [
	['json', { type: 'JSON', serializer: (value): string => `'${JSON.stringify(value).replace(/'/g, "''")}'` }],
	['any', { extends: 'json' }],
	['boolean', { type: 'BOOLEAN', serializer: (value): string => `${value}` }],
	['bool', { extends: 'boolean' }],
	['snowflake', { type: 'VARCHAR(19)', serializer: (value): string => `'${value}'` }],
	['channel', { extends: 'snowflake' }],
	['textchannel', { extends: 'channel' }],
	['voicechannel', { extends: 'channel' }],
	['categorychannel', { extends: 'channel' }],
	['guild', { extends: 'snowflake' }],
	['number', { type: 'FLOAT', serializer: (value): string => `${value}` }],
	['float', { extends: 'number' }],
	['integer', { extends: 'number', type: 'INTEGER' }],
	['command', { type: 'TEXT' }],
	['language', { type: 'VARCHAR(5)' }],
	['role', { extends: 'snowflake' }],
	['string', { type: ({ max }): string => max ? `VARCHAR(${max})` : 'TEXT' }],
	['url', { type: 'TEXT' }],
	['user', { extends: 'snowflake' }]
];

export const OPTIONS: Required<QueryBuilderEntryOptions> = {
	array: () => 'TEXT',
	arraySerializer: (values) => `'${JSON.stringify(values).replace(/'/g, "''")}'`,
	formatDatatype: (name, datatype, def = null) => `${name} ${datatype}${def !== null ? ` NOT NULL DEFAULT ${def}` : ''}`,
	serializer: (value) => `'${(isObject(value) ? JSON.stringify(value) : String(value)).replace(/'/g, "''")}'`
};
