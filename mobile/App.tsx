import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { theme } from './src/theme/tokens.js';
import {
  HomeScreen,
  GroupBuyDetailScreen,
  ChampionScreen,
  WalletScreen,
  OrdersScreen,
} from './src/screens/index.js';

type ActiveTab = 'discover' | 'orders' | 'wallet' | 'champion';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [activeGroupBuyId, setActiveGroupBuyId] = useState<string | null>(null);

  const renderContent = () => {
    // If a group buy is currently selected, show detail screen
    if (activeGroupBuyId) {
      return (
        <GroupBuyDetailScreen
          groupBuyId={activeGroupBuyId}
          onBack={() => setActiveGroupBuyId(null)}
          onProceedToCheckout={(quantity) => {
            alert(`Proceeding to Paystack checkout for ${quantity} unit(s)`);
          }}
        />
      );
    }

    switch (activeTab) {
      case 'discover':
        return (
          <HomeScreen
            onSelectGroupBuy={(id) => setActiveGroupBuyId(id)}
            onOpenChampion={() => setActiveTab('champion')}
          />
        );
      case 'orders':
        return <OrdersScreen />;
      case 'wallet':
        return <WalletScreen />;
      case 'champion':
        return (
          <ChampionScreen
            onCreateGroupBuy={() => {
              alert('Opening Champion 6-Step Group Buy Creation Wizard (§9)');
            }}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Main View Area */}
      <View style={styles.main}>{renderContent()}</View>

      {/* Bottom Navigation Bar (Hidden when inside a detail screen) */}
      {!activeGroupBuyId && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('discover')}
          >
            <Text style={[styles.tabIcon, activeTab === 'discover' && styles.tabActive]}>
              🛒
            </Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'discover' && styles.tabLabelActive,
              ]}
            >
              Discover
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('orders')}
          >
            <Text style={[styles.tabIcon, activeTab === 'orders' && styles.tabActive]}>
              📦
            </Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'orders' && styles.tabLabelActive,
              ]}
            >
              Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('wallet')}
          >
            <Text style={[styles.tabIcon, activeTab === 'wallet' && styles.tabActive]}>
              💳
            </Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'wallet' && styles.tabLabelActive,
              ]}
            >
              Wallet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('champion')}
          >
            <Text style={[styles.tabIcon, activeTab === 'champion' && styles.tabActive]}>
              ⭐
            </Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'champion' && styles.tabLabelActive,
              ]}
            >
              Champion
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  main: {
    flex: 1,
  },
  tabBar: {
    height: theme.components.navigation.tabBarHeight,
    backgroundColor: theme.colors.surface.card,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.6,
  },
  tabActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  tabLabelActive: {
    color: theme.brandGreen,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
