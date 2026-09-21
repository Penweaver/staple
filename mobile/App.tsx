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
  LocationSelectScreen,
  ProductListScreen,
  ProductDetailScreen,
  BasketListScreen,
  BasketDetailScreen,
} from './src/screens/index.js';

type ActiveTab = 'discover' | 'catalogue' | 'orders' | 'wallet' | 'champion';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [activeGroupBuyId, setActiveGroupBuyId] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [activeBasketId, setActiveBasketId] = useState<string | null>(null);
  const [showBasketsList, setShowBasketsList] = useState<boolean>(false);
  const [showLocationSelect, setShowLocationSelect] = useState<boolean>(false);

  const renderContent = () => {
    // 1. Location Selection Modal/Screen
    if (showLocationSelect) {
      return (
        <LocationSelectScreen
          onBack={() => setShowLocationSelect(false)}
          onLocationSaved={() => setShowLocationSelect(false)}
        />
      );
    }

    // 2. Product Detail Screen
    if (activeProductId) {
      return (
        <ProductDetailScreen
          productId={activeProductId}
          onBack={() => setActiveProductId(null)}
          onStartGroupBuy={() => {
            setActiveProductId(null);
            setActiveTab('champion');
          }}
          onViewLiveGroupBuys={() => {
            setActiveProductId(null);
            setActiveTab('discover');
          }}
        />
      );
    }

    // 3. Basket Detail Screen
    if (activeBasketId) {
      return (
        <BasketDetailScreen
          basketId={activeBasketId}
          onBack={() => setActiveBasketId(null)}
          onStartBasketGroupBuy={() => {
            setActiveBasketId(null);
            setActiveTab('champion');
          }}
        />
      );
    }

    // 4. Basket List Screen
    if (showBasketsList) {
      return (
        <BasketListScreen
          onSelectBasket={(id) => setActiveBasketId(id)}
          onBack={() => setShowBasketsList(false)}
        />
      );
    }

    // 5. Group Buy Detail Screen
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

    // 6. Main Tabs
    switch (activeTab) {
      case 'discover':
        return (
          <HomeScreen
            onSelectGroupBuy={(id) => setActiveGroupBuyId(id)}
            onOpenChampion={() => setActiveTab('champion')}
          />
        );
      case 'catalogue':
        return (
          <ProductListScreen
            onSelectProduct={(id) => setActiveProductId(id)}
            onOpenLocationSelect={() => setShowLocationSelect(true)}
            onOpenBaskets={() => setShowBasketsList(true)}
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

  const isSubScreen =
    !!activeGroupBuyId ||
    !!activeProductId ||
    !!activeBasketId ||
    showBasketsList ||
    showLocationSelect;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Main View Area */}
      <View style={styles.main}>{renderContent()}</View>

      {/* Bottom Navigation Bar (Hidden when inside a detail screen) */}
      {!isSubScreen && (
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
              Deals
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('catalogue')}
          >
            <Text style={[styles.tabIcon, activeTab === 'catalogue' && styles.tabActive]}>
              🌾
            </Text>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'catalogue' && styles.tabLabelActive,
              ]}
            >
              Catalogue
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
