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
  ChampionCreateScreen,
  WalletScreen,
  OrdersScreen,
  CheckoutScreen,
  OrderConfirmationScreen,
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
  const [showChampionWizard, setShowChampionWizard] = useState<boolean>(false);

  // Checkout flow state
  const [checkoutData, setCheckoutData] = useState<{
    itemTitle: string;
    unit: string;
    unitPrice: number;
    quantity: number;
    collectionHub: string;
  } | null>(null);

  const [confirmedOrder, setConfirmedOrder] = useState<{
    orderNumber: string;
    pickupCode: string;
    totalAmount: number;
    walletUsed: number;
    gatewayPaid: number;
    collectionHub: string;
  } | null>(null);

  const renderContent = () => {
    // 1. Order Confirmation Screen
    if (confirmedOrder) {
      return (
        <OrderConfirmationScreen
          orderNumber={confirmedOrder.orderNumber}
          pickupCode={confirmedOrder.pickupCode}
          totalAmount={confirmedOrder.totalAmount}
          walletUsed={confirmedOrder.walletUsed}
          gatewayPaid={confirmedOrder.gatewayPaid}
          collectionHub={confirmedOrder.collectionHub}
          onViewOrders={() => {
            setConfirmedOrder(null);
            setActiveGroupBuyId(null);
            setActiveTab('orders');
          }}
          onShare={() => {
            alert('Opening WhatsApp to invite neighbors!');
          }}
        />
      );
    }

    // 2. Checkout Screen
    if (checkoutData) {
      return (
        <CheckoutScreen
          itemTitle={checkoutData.itemTitle}
          unit={checkoutData.unit}
          unitPrice={checkoutData.unitPrice}
          quantity={checkoutData.quantity}
          collectionHub={checkoutData.collectionHub}
          onBack={() => setCheckoutData(null)}
          onPaymentSuccess={(res) => {
            setConfirmedOrder({
              ...res,
              collectionHub: checkoutData.collectionHub,
            });
            setCheckoutData(null);
          }}
        />
      );
    }

    // 3. Champion 6-Step Creation Wizard
    if (showChampionWizard) {
      return (
        <ChampionCreateScreen
          onBack={() => setShowChampionWizard(false)}
          onSuccess={(slug) => {
            setShowChampionWizard(false);
            setActiveGroupBuyId('gb-1');
          }}
        />
      );
    }

    // 4. Location Selection Modal/Screen
    if (showLocationSelect) {
      return (
        <LocationSelectScreen
          onBack={() => setShowLocationSelect(false)}
          onLocationSaved={() => setShowLocationSelect(false)}
        />
      );
    }

    // 5. Product Detail Screen
    if (activeProductId) {
      return (
        <ProductDetailScreen
          productId={activeProductId}
          onBack={() => setActiveProductId(null)}
          onStartGroupBuy={() => {
            setActiveProductId(null);
            setShowChampionWizard(true);
          }}
          onViewLiveGroupBuys={() => {
            setActiveProductId(null);
            setActiveTab('discover');
          }}
        />
      );
    }

    // 6. Basket Detail Screen
    if (activeBasketId) {
      return (
        <BasketDetailScreen
          basketId={activeBasketId}
          onBack={() => setActiveBasketId(null)}
          onStartBasketGroupBuy={() => {
            setActiveBasketId(null);
            setShowChampionWizard(true);
          }}
        />
      );
    }

    // 7. Basket List Screen
    if (showBasketsList) {
      return (
        <BasketListScreen
          onSelectBasket={(id) => setActiveBasketId(id)}
          onBack={() => setShowBasketsList(false)}
        />
      );
    }

    // 8. Group Buy Detail Screen
    if (activeGroupBuyId) {
      return (
        <GroupBuyDetailScreen
          groupBuyId={activeGroupBuyId}
          onBack={() => setActiveGroupBuyId(null)}
          onProceedToCheckout={(quantity) => {
            setCheckoutData({
              itemTitle: 'Mama Gold Premium Parboiled Rice (50kg)',
              unit: 'bag',
              unitPrice: 82875,
              quantity,
              collectionHub: 'staple Hub — Lekki Admiralty (42 Admiralty Way)',
            });
          }}
        />
      );
    }

    // 9. Main Tabs
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
              setShowChampionWizard(true);
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
    showLocationSelect ||
    showChampionWizard ||
    !!checkoutData ||
    !!confirmedOrder;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Main View Area */}
      <View style={styles.main}>{renderContent()}</View>

      {/* Bottom Navigation Bar (Hidden when inside a detail/wizard/checkout screen) */}
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
