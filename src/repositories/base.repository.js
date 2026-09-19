import { supabaseAdmin } from '../services/supabaseClient.js';
import { toCamel, toSnake } from '../utils/case.js';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants.js';

export class BaseRepository {
  constructor(table) {
    this.table = table;
  }

  wrap(error) {
    const nested = error?.cause || error;
    const causeCode = nested?.code || nested?.cause?.code;
    const causeMessage = nested?.cause?.message || nested?.message || error?.message;
    const combined = `${error?.message || ''} ${causeMessage || ''}`;
    const isNetworkFailure =
      String(error?.message || '').includes('fetch failed')
      || ['ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', 'UND_ERR_CONNECT_TIMEOUT'].includes(causeCode);

    const missingColumn = combined.match(/Could not find the '([^']+)' column/i)?.[1];
    const isMissingTable =
      !missingColumn
      && (
        String(error?.message || '').includes('schema cache')
        || String(error?.code || '') === 'PGRST205'
      );

    const err = new Error(
      isNetworkFailure
        ? `Database unreachable${causeCode ? ` (${causeCode})` : ''}: ${causeMessage || 'fetch failed'}`
        : missingColumn
          ? `Missing database column '${missingColumn}' on '${this.table}'. Run database/migrations/2026-09-18-lesson-pdfs.sql, then NOTIFY pgrst, 'reload schema';`
          : isMissingTable
            ? `Missing database table '${this.table}'. Run database/schema.sql in the Supabase SQL editor.`
            : (error.message || 'Database error')
    );
    err.cause = error;
    err.missingColumn = missingColumn || null;
    err.statusCode = isNetworkFailure
      ? HTTP_STATUS.SERVICE_UNAVAILABLE
      : HTTP_STATUS.BAD_REQUEST;
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

  async findAll(options = {}) {
    const limit = 100;
    const items = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (items.length < total) {
      const batch = await this.findMany({ ...options, page, limit });
      total = batch.total;
      items.push(...batch.items);
      if (!batch.items.length || batch.items.length < limit) break;
      page += 1;
      if (page > 500) break;
    }

    return { items, total: items.length };
  }

  async increment(id, column, amount = 1) {
    const row = await this.findById(id);
    if (!row) return null;
    return this.update(id, { [column]: (row[column] || 0) + amount });
  }
}
