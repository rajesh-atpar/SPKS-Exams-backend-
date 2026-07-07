import { supabaseAdmin } from '../services/supabaseClient.js';
import { Notification } from '../models/Notification.model.js';
import { PAGINATION } from '../config/constants.js';

export class NotificationRepository {
  async create(notificationData) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        recipient_id: notificationData.recipientId,
        recipient_type: notificationData.recipientType,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        related_id: notificationData.relatedId,
        related_type: notificationData.relatedType
      })
      .select('*')
      .single();

    if (error) throw error;
    return Notification.fromDB(data);
  }

  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? Notification.fromDB(data) : null;
  }

  async findByRecipientId(recipientId, recipientType, filters = {}, pagination = {}) {
    const page = pagination.page || PAGINATION.DEFAULT_PAGE;
    const limit = pagination.limit || PAGINATION.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_id', recipientId)
      .eq('recipient_type', recipientType);

    if (filters.isRead !== undefined) {
      query = query.eq('is_read', filters.isRead);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      notifications: data.map(item => Notification.fromDB(item)),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  async markAsRead(id) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return Notification.fromDB(data);
  }

  async markAllAsRead(recipientId, recipientType) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', recipientId)
      .eq('recipient_type', recipientType);

    if (error) throw error;
    return true;
  }

  async delete(id) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async getUnreadCount(recipientId, recipientType) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('recipient_id', recipientId)
      .eq('recipient_type', recipientType)
      .eq('is_read', false);

    if (error) throw error;
    return data.length;
  }
}

export default new NotificationRepository();
