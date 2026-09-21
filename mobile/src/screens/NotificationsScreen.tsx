/**
 * STAPLE LIMITED — In-App Notifications Feed (Phase 8)
 * Real-time notification updates across pricing, orders, hubs, and support.
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { theme } from '../theme/tokens';
import { Typography, Card, Button, Header, EmptyState } from '../components/index';
import { NotificationType } from '@staple/shared';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  isRead: boolean;
  deepLink?: string;
}

export const NotificationsScreen: React.FC<{
  onBack?: () => void;
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
}> = ({ onBack, onNavigate }) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      type: NotificationType.PRICING_TIER_REACHED,
      title: 'Price Drop Unlocked! 💰',
      body: 'Mama Gold Rice in Lekki Phase 1 reached 50 bags! You saved an extra ₦2,125 per bag, which will be credited to your staple wallet.',
      time: '15m ago',
      isRead: false,
    },
    {
      id: 'n-2',
      type: NotificationType.COLLECTION_READY,
      title: 'Ready for Pickup! 📦',
      body: 'Your 2x 25L Cooking Oil orders have arrived at Lekki Admiralty Hub. Show your 6-digit code STP-782-910 at the counter.',
      time: '2h ago',
      isRead: false,
    },
    {
      id: 'n-3',
      type: NotificationType.FESTIVE_INSTALMENT_REMINDER,
      title: 'Festive Instalment Reminder ⏳',
      body: 'Instalment #2 of ₦80,000 for your Adeyemi Wedding Owambe Plan is due on Oct 10, 2026.',
      time: '1d ago',
      isRead: true,
    },
    {
      id: 'n-4',
      type: NotificationType.SUPPORT_RESPONSE,
      title: 'Support Desk Reply 💬',
      body: 'Our support agent replied to your ticket STP-TCK-2026-0012 regarding hub collection proxy.',
      time: '2d ago',
      isRead: true,
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleSelectNotification = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );

    if (item.type === NotificationType.COLLECTION_READY) {
      onNavigate?.('Orders');
    } else if (item.type === NotificationType.FESTIVE_INSTALMENT_REMINDER) {
      onNavigate?.('Festive');
    } else if (item.type === NotificationType.SUPPORT_RESPONSE) {
      onNavigate?.('Support');
    }
  };

  const filtered =
    filter === 'all'
      ? notifications
      : notifications.filter((n) => !n.isRead);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIconForType = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.PRICING_TIER_REACHED:
        return '💰';
      case NotificationType.TARGET_REACHED:
        return '🎉';
      case NotificationType.COLLECTION_READY:
      case NotificationType.FULFILMENT_READY:
        return '📦';
      case NotificationType.FESTIVE_INSTALMENT_REMINDER:
        return '⏳';
      case NotificationType.SUPPORT_RESPONSE:
        return '💬';
      case NotificationType.CHAMPION_APPROVED:
        return '⭐';
      default:
        return '📢';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header locationName="Notifications" />

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Typography
              variant="caption"
              weight="bold"
              color={filter === 'all' ? theme.colors.neutral[0] : theme.textSecondary}
            >
              All ({notifications.length})
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
            onPress={() => setFilter('unread')}
          >
            <Typography
              variant="caption"
              weight="bold"
              color={filter === 'unread' ? theme.colors.neutral[0] : theme.textSecondary}
            >
              Unread ({unreadCount})
            </Typography>
          </TouchableOpacity>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Typography variant="caption" color={theme.brandGreen} weight="bold">
              Mark all as read
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No Notifications"
            description={
              filter === 'unread'
                ? 'You have caught up with all your notifications!'
                : 'You have no notifications yet. Updates on group buys and orders will appear here.'
            }
          />
        ) : (
          filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => handleSelectNotification(item)}
            >
              <Card
                elevated
                style={[
                  styles.notificationCard,
                  !item.isRead && styles.notificationCardUnread,
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <Typography variant="h3" style={{ marginRight: 6 }}>
                      {getIconForType(item.type)}
                    </Typography>
                    <Typography variant="body" weight="bold">
                      {item.title}
                    </Typography>
                  </View>
                  <View style={styles.timeRow}>
                    <Typography variant="caption" color={theme.textMuted}>
                      {item.time}
                    </Typography>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>
                </View>

                <Typography variant="bodySm" color={theme.textSecondary} style={styles.bodyText}>
                  {item.body}
                </Typography>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    backgroundColor: theme.colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  filterTab: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.neutral[100],
  },
  filterTabActive: {
    backgroundColor: theme.brandGreen,
  },
  content: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  notificationCard: {
    marginBottom: theme.spacing[3],
    backgroundColor: theme.colors.surface.card,
  },
  notificationCardUnread: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.brandGreen,
  },
  bodyText: {
    lineHeight: 20,
  },
});
