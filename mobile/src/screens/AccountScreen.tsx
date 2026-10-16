import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { UserSession } from './AuthScreen';

interface AccountScreenProps {
  session: UserSession | null;
  onLogout: () => void;
  onNavigateToWallet: () => void;
  onNavigateToOrders: () => void;
  onNavigateToSupport: () => void;
  onNavigateToChampion: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  session,
  onLogout,
  onNavigateToWallet,
  onNavigateToOrders,
  onNavigateToSupport,
  onNavigateToChampion,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const user = session || {
    id: 'usr_guest',
    name: 'Guest Member',
    phone: '08000000000',
    email: 'guest@staple.africa',
    hub: 'Lekki Phase 1 Hub',
    role: 'member' as const,
    isKycVerified: false,
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16A34A" />

      {/* Profile Header Hero */}
      <View style={styles.headerHero}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{getInitials(user.name)}</Text>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userPhone}>🇳🇬 {user.phone}</Text>

        <View style={styles.badgeRow}>
          {user.isKycVerified ? (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>✓ KYC Verified</Text>
            </View>
          ) : (
            <View style={styles.guestBadge}>
              <Text style={styles.guestBadgeText}>Guest Account</Text>
            </View>
          )}

          {user.role === 'champion' && (
            <View style={styles.championBadge}>
              <Text style={styles.championBadgeText}>⭐ Lead Champion</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Hub Location Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Primary Collection Hub</Text>
              <Text style={styles.infoValue}>{user.hub}</Text>
            </View>
            <Text style={styles.infoSub}>Active</Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionGridCard}
            onPress={onNavigateToWallet}
          >
            <Text style={styles.actionGridIcon}>💳</Text>
            <Text style={styles.actionGridTitle}>STAPLE Wallet</Text>
            <Text style={styles.actionGridSub}>Zenith Bank transfer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionGridCard}
            onPress={onNavigateToOrders}
          >
            <Text style={styles.actionGridIcon}>📦</Text>
            <Text style={styles.actionGridTitle}>My Orders</Text>
            <Text style={styles.actionGridSub}>Pickup codes & status</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Section */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onNavigateToChampion}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuEmoji}>⭐</Text>
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Neighborhood Champion</Text>
              <Text style={styles.menuItemDesc}>Organize bulk buys & earn 3% commission</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={onNavigateToSupport}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuEmoji}>🎧</Text>
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Customer Support & Chat</Text>
              <Text style={styles.menuItemDesc}>Send payment proof or get help</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('App Information', 'STAPLE Android Client v1.1.0\nCloud Backend: Supabase eu-west-1\nSTAPLE LIMITED — Lagos, Nigeria')}
          >
            <View style={styles.menuIconContainer}>
              <Text style={styles.menuEmoji}>ℹ️</Text>
            </View>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>About STAPLE LIMITED</Text>
              <Text style={styles.menuItemDesc}>v1.1.0 Production Release</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* LOGOUT BUTTON */}
        <Pressable
          style={styles.logoutButton}
          onPress={() => setShowLogoutConfirm(true)}
          android_ripple={{ color: '#FEE2E2' }}
        >
          <Text style={styles.logoutButtonIcon}>🚪</Text>
          <Text style={styles.logoutButtonText}>Sign Out of STAPLE</Text>
        </Pressable>

        <Text style={styles.copyrightText}>
          STAPLE LIMITED • RC 7819201 • Lagos, Nigeria
        </Text>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Text style={{ fontSize: 28 }}>🚪</Text>
            </View>
            <Text style={styles.modalTitle}>Sign Out?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to sign out of STAPLE on this device? You can log back in at any time with your phone number.
            </Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLogoutConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
              >
                <Text style={styles.modalConfirmText}>Yes, Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerHero: {
    backgroundColor: '#16A34A',
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
  },
  avatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 3,
  },
  avatarLargeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#16A34A',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userPhone: {
    fontSize: 13,
    color: '#DCFCE7',
    marginTop: 2,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    color: '#14532D',
    fontSize: 11,
    fontWeight: '700',
  },
  guestBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  guestBadgeText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  championBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  championBadgeText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollBody: {
    flex: 1,
  },
  scrollInner: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
    marginTop: 2,
  },
  infoSub: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '700',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionGridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
  },
  actionGridIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionGridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  actionGridSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuEmoji: {
    fontSize: 18,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  menuItemDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  menuChevron: {
    fontSize: 22,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 68,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 1,
    gap: 8,
    marginBottom: 20,
  },
  logoutButtonIcon: {
    fontSize: 18,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  copyrightText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    elevation: 8,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
