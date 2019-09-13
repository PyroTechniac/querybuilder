import { SchemaEntry } from 'klasa';
import { mergeDefault, deepClone } from './lib/util';
import { OPTIONS, DATATYPES } from './lib/constants';

export class QueryBuilder extends Map<string, Required<QueryBuilderDatatype>> {

	private array: QueryBuilderArray;
	private arraySerializer: QueryBuilderArraySerializer;
	private formatDatatype: QueryBuilderFormatDatatype;
	private serializer: QueryBuilderSerializer;

	/**
	 * @since 0.5.0
	 * @param options The default options for all datatypes plus formatDatatype
	 */
	public constructor(options: QueryBuilderEntryOptions = {}) {
		super();
		mergeDefault(OPTIONS, options);

		/**
		 * The default array handler for this instance
		 * @since 0.5.0
		 */
		this.array = options.array;

		/**
		 * The default array handler for this instance
		 * @since 0.5.0
		 */
		this.arraySerializer = options.arraySerializer;

		/**
		 * The default datatype formatter for the SQL database
		 * @since 0.5.0
		 */
		this.formatDatatype = options.formatDatatype;

		/**
		 * The default serializer for this instance
		 * @since 0.5.0
		 */
		this.serializer = options.serializer;

		// Register all default datatypes
		for (const [name, data] of DATATYPES) this.add(name, data);
	}

	/**
	 * Register a datatype to this instance
	 * @since 0.5.0
	 * @param name The name for the datatype
	 * @param data The options for this query builder
	 * @chainable
	 */
	public add(name: string, data: QueryBuilderDatatype): this {
		// Resolve extends by pointing to another datatype
		if (typeof data.extends === 'string') {
			const datatype = this.get(data.extends);
			if (datatype) this.set(name, Object.assign(Object.create(datatype), data));
			else throw new Error(`"extends" in datatype ${name} does not point to a registered datatype.`);
		} else {
			const datatype = this.get(name);
			if (datatype) {
				Object.assign(datatype, data);
			} else {
				this.set(name, mergeDefault({
					array: this.array,
					arraySerializer: this.arraySerializer,
					extends: undefined,
					formatDatatype: this.formatDatatype,
					serializer: this.serializer,
					type: undefined
				}, deepClone(data)));
			}
		}
		return this;
	}

	/**
	 * Remove a datatype from this instance
	 * @since 0.5.0
	 * @param name The name for the datatype to remove
	 * @chainable
	 */
	public remove(name: string): this {
		this.delete(name);
		return this;
	}

	/**
	 * Parse a SchemaEntry for the SQL datatype creation
	 * @since 0.5.0
	 * @param schemaEntry The SchemaEntry to process
	 * @example
	 * qb.generateDatatype(this.client.gateways.get('guilds').schema.get('prefix'));
	 * // type: 'string', array: true, max: 10
	 * // -> prefix VARCHAR(10)[]
	 */
	public generateDatatype(schemaEntry: SchemaEntry): string {
		const datatype = this.get(schemaEntry.type) || null;
		const parsedDefault = this.serialize(schemaEntry.default, schemaEntry, datatype);
		const type = typeof datatype.type === 'function' ? datatype.type(schemaEntry) : datatype.type;
		const parsedDatatype = schemaEntry.array ? datatype.array(type) : type;
		return datatype.formatDatatype(schemaEntry.path, parsedDatatype, parsedDefault);
	}

	/**
	 * Parses the value
	 * @since 0.5.0
	 * @param value The value to parse
	 * @param schemaEntry The SchemaEntry instance that manages this instance
	 * @param datatype The QueryBuilder datatype
	 */
	public serialize(value: unknown, schemaEntry: SchemaEntry, datatype: Required<QueryBuilderDatatype> = this.get(schemaEntry.type)): string | null {
		if (!datatype) throw new Error(`The type '${schemaEntry.type}' is unavailable, please set its definition.`);
		if (schemaEntry.array && !datatype.array) throw new Error(`The datatype '${datatype.type}' does not support arrays.`);

		// If value is null, there is nothing to resolve.
		if (value === null) return null;

		return schemaEntry.array ?
			datatype.arraySerializer(value as readonly unknown[], schemaEntry, datatype.serializer) :
			datatype.serializer(value, schemaEntry);
	}

	/**
	 * Returns any errors in the query builder
	 * @since 0.5.0
	 */
	public debug(): string {
		const errors = [];
		for (const [name, datatype] of this) {
			if (!['string', 'function'].includes(typeof datatype.type)) errors.push(`"type" in datatype ${name} must be a string or a function, got: ${typeof datatype.type}`);
			if (typeof datatype.array !== 'function') errors.push(`"array" in datatype ${name} must be a function, got: ${typeof datatype.array}`);
			if (typeof datatype.arraySerializer !== 'function') errors.push(`"arraySerializer" in datatype ${name} must be a function, got: ${typeof datatype.arraySerializer}`);
			if (typeof datatype.formatDatatype !== 'function') errors.push(`"formatDatatype" in datatype ${name} must be a function, got: ${typeof datatype.formatDatatype}`);
			if (typeof datatype.serializer !== 'function') errors.push(`"serializer" in datatype ${name} must be a function, got: ${typeof datatype.serializer}`);
		}
		return errors.join('\n');
	}

}

export interface QueryBuilderArray {
	/**
	 * @param entry The schema entry for context
	 */
	(entry: string): string;
}

export interface QueryBuilderArraySerializer {
	/**
	 * @param values The values to resolve
	 * @param schemaEntry The SchemaEntry that manages this instance
	 * @param serializer The single-element serializer
	 */
	(values: readonly unknown[], schemaEntry: SchemaEntry, resolver: QueryBuilderSerializer): string;
}

export interface QueryBuilderSerializer {
	/**
	 * @param value The value to serialize
	 * @param schemaEntry The SchemaEntry that manages this instance
	 */
	(value: unknown, schemaEntry: SchemaEntry): string;
}

export interface QueryBuilderFormatDatatype {
	/**
	 * @param name The name of the SQL column
	 * @param datatype The SQL datatype
	 * @param def The default value
	 */
	(name: string, datatype: string, def?: string | null): string;
}

export interface QueryBuilderType {
	/**
	 * @param entry The SchemaEntry to determine the SQL type from
	 */
	(schemaEntry: SchemaEntry): string;
}

export interface QueryBuilderEntryOptions {
	/**
	 * The default array handler for this instance
	 */
	array?: QueryBuilderArray;

	/**
	 * The default array handler for this instance
	 */
	arraySerializer?: QueryBuilderArraySerializer;

	/**
	 * The default datatype formatter for the SQL database
	 */
	formatDatatype?: QueryBuilderFormatDatatype;

	/**
	 * The default serializer for this instance
	 */
	serializer?: QueryBuilderSerializer;
}

export interface QueryBuilderDatatype extends QueryBuilderEntryOptions {
	/**
	 * The SQL datatype
	 */
	type?: QueryBuilderType | string;

	/**
	 * The QueryBuilder primitive this extends to
	 */
	extends?: string;
}
