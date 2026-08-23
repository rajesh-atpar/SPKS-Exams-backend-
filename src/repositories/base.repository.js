import { supabaseAdmin } from '../services/supabaseClient.js';
import { toCamel, toSnake } from '../utils/case.js';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants.js';

export class BaseRepository {
  constructor(table) {
    this.table = table;
  }

  wrap(error) {
    const err = new Error(error.message || 'Database error');
    err.statusCode = HTTP_STATUS.BAD_REQUEST;
    err.code = ERROR_CODES.DATABASE_ERROR;
    return err;
  }

  map(row) {
    return row ? toCamel(row) : null;
  }

  mapMany(rows) {
    return (rows || []).map((row) => this.map(row));
  }

  async findById(id, select = '*') {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select(select)
      .eq('id', id)
      .maybeSingle();

    if (error) throw this.wrap(error);
    return this.map(data);
  }

  async findOne(filters, select = '*') {
    let query = supabaseAdmin.from(this.table).select(select);

    Object.entries(toSnake(filters)).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query.maybeSingle();
    if (error) throw this.wrap(error);
    return this.map(data);
  }

  async findMany({
    filters = {},
    page = 1,
    limit = 20,
    search,
    searchFields = [],
    orderBy = 'created_at',
    order = 'desc',
    select = '*',
    inFilters = {}
  } = {}) {
    let query = supabaseAdmin.from(this.table).select(select, { count: 'exact' });

    Object.entries(toSnake(filters)).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });

    Object.entries(inFilters).forEach(([key, values]) => {
      if (values?.length) {
        query = query.in(key, values);
      }
    });

    if (search && searchFields.length) {
      query = query.or(searchFields.map((field) => `${field}.ilike.%${search}%`).join(','));
    }

    const from = (page - 1) * limit;
    const { data, error, count } = await query
      .order(orderBy, { ascending: order === 'asc' })
      .range(from, from + limit - 1);

    if (error) throw this.wrap(error);
    return { items: this.mapMany(data), total: count || 0 };
  }

  async create(payload, select = '*') {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .insert(toSnake(payload))
      .select(select)
      .single();

    if (error) throw this.wrap(error);
    return this.map(data);
  }

  async update(id, payload, select = '*') {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .update(toSnake(payload))
      .eq('id', id)
      .select(select)
      .single();

    if (error) throw this.wrap(error);
    return this.map(data);
  }

  async remove(id) {
    const { error } = await supabaseAdmin.from(this.table).delete().eq('id', id);
    if (error) throw this.wrap(error);
    return true;
  }

  async increment(id, column, amount = 1) {
    const row = await this.findById(id);
    if (!row) return null;
    return this.update(id, { [column]: (row[column] || 0) + amount });
  }
}
