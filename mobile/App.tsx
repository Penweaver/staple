import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  BackHandler,
  ToastAndroid,
  Platform,
} from 'react-native';
import { theme } from './src/theme/tokens';
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
  SupportScreen,
  AuthScreen,
  AccountScreen,
  UserSession,
} from './src/screens/index';

type ActiveTab = 'discover' | 'catalogue' | 'orders' | 'wallet' | 'account';

export default function App() {
  // Session State
  const [session, setSession] = useState<UserSession | null>({
    id: 'usr_amina_01',
    name: 'Amina Bello',
    phone: '08034567890',
    email: 'amina.bello@example.ng',
    hub: 'Lekki Phase 1 Hub',
    role: 'member',
    isKycVerified: true,
  });
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [activeGroupBuyId, setActiveGroupBuyId] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [activeBasketId, setActiveBasketId] = useState<string | null>(null);
  const [showBasketsList, setShowBasketsList] = useState<boolean>(false);
  const [showLocationSelect, setShowLocationSelect] = useState<boolean>(false);
  const [showChampionWizard, setShowChampionWizard] = useState<boolean>(false);
  const [showSupportChat, setShowSupportChat] = useState<boolean>(false);
  const [showChampionScreen, setShowChampionScreen] = useState<boolean>(false);

  // Hardware Back Button tracker
  const [lastBackPressed, setLastBackPressed] = useState<number>(0);

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

  // Android Hardware Back Button Handling
  useEffect(() => {
    const onBackPress = () => {
      // 1. Pop sub-screens in reverse stack order
      if (confirmedOrder) {
        setConfirmedOrder(null);
        return true;
      }
      if (showSupportChat) {
        setShowSupportChat(false);
        return true;
      }
      if (checkoutData) {
        setCheckoutData(null);
        return true;
      }
      if (showChampionWizard) {
        setShowChampionWizard(false);
        return true;
      }
      if (showChampionScreen) {
        setShowChampionScreen(false);
        return true;
      }
      if (showLocationSelect) {
        setShowLocationSelect(false);
        return true;
      }
      if (activeProductId) {
        setActiveProductId(null);
        return true;
      }
      if (activeBasketId) {
        setActiveBasketId(null);
        return true;
      }
      if (showBasketsList) {
        setShowBasketsList(false);
        return true;
      }
      if (activeGroupBuyId) {
        setActiveGroupBuyId(null);
        return true;
      }

      // 2. If on another tab, return to 'discover' (Home)
      if (activeTab !== 'discover') {
        setActiveTab('discover');
        return true;
      }

      // 3. Double-back to exit on Home tab
      const now = Date.now();
      if (now - lastBackPressed < 2000) {
        BackHandler.exitApp();
        return true;
      }
      setLastBackPressed(now);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Press back again to exit STAPLE', ToastAndroid.SHORT);
      }
      return true;
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => subscription.remove();
  }, [
    confirmedOrder,
    showSupportChat,
    checkoutData,
    showChampionWizard,
    showChampionScreen,
    showLocationSelect,
    activeProductId,
    activeBasketId,
    showBasketsList,
    activeGroupBuyId,
    activeTab,
    lastBackPressed,
  ]);

  // Auth Gate: Show AuthScreen if not logged in and not guest
  if (!session && !isGuest) {
    return (
      <AuthScreen
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          setIsGuest(false);
        }}
        onContinueAsGuest={() => {
          setIsGuest(true);
        }}
      />
    );
  }

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

    // 1b. Support/Admin Chat (for proof of payment)
    if (showSupportChat) {
      return (
        <SupportScreen
          onBack={() => setShowSupportChat(false)}
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
          onFundWallet={() => {
            setCheckoutData(null);
            setActiveTab('wallet');
          }}
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

    // 3b. Champion Screen
    if (showChampionScreen) {
      return (
        <ChampionScreen
          onCreateGroupBuy={() => {
            setShowChampionWizard(true);
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
            onOpenChampion={() => setShowChampionScreen(true)}
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
        return (
          <WalletScreen
            onSendProofToAdmin={() => setShowSupportChat(true)}
          />
        );
      case 'account':
        return (
          <AccountScreen
            session={session}
            onLogout={() => {
              setSession(null);
              setIsGuest(false);
            }}
            onNavigateToWallet={() => setActiveTab('wallet')}
            onNavigateToOrders={() => setActiveTab('orders')}
            onNavigateToSupport={() => setShowSupportChat(true)}
            onNavigateToChampion={() => setShowChampionScreen(true)}
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
    showChampionScreen ||
    showSupportChat ||
    !!checkoutData ||
    !!confirmedOrder;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Main View Area */}
      <View style={styles.main}>{renderContent()}</View>

      {/* Modern Android Bottom Navigation Bar (Hidden when inside a sub-screen) */}
      {!isSubScreen && (
        <View style={styles.tabBar}>
          <Pressable
            style={styles.tabItem}
            onPress={() => setActiveTab('discover')}
            android_ripple={{ color: '#E5E7EB', borderless: true }}
          >
            <View style={[styles.tabIconWrap, activeTab === 'discover' && styles.tabIconWrapActive]}>
              <Text style={styles.tabIcon}>🛒</Text>
            </View>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'discover' && styles.tabLabelActive,
              ]}
            >
              Deals
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => setActiveTab('catalogue')}
            android_ripple={{ color: '#E5E7EB', borderless: true }}
          >
            <View style={[styles.tabIconWrap, activeTab === 'catalogue' && styles.tabIconWrapActive]}>
              <Text style={styles.tabIcon}>🌾</Text>
            </View>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'catalogue' && styles.tabLabelActive,
              ]}
            >
              Catalogue
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => setActiveTab('orders')}
            android_ripple={{ color: '#E5E7EB', borderless: true }}
          >
            <View style={[styles.tabIconWrap, activeTab === 'orders' && styles.tabIconWrapActive]}>
              <Text style={styles.tabIcon}>📦</Text>
            </View>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'orders' && styles.tabLabelActive,
              ]}
            >
              Orders
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => setActiveTab('wallet')}
            android_ripple={{ color: '#E5E7EB', borderless: true }}
          >
            <View style={[styles.tabIconWrap, activeTab === 'wallet' && styles.tabIconWrapActive]}>
              <Text style={styles.tabIcon}>💳</Text>
            </View>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'wallet' && styles.tabLabelActive,
              ]}
            >
              Wallet
            </Text>
          </Pressable>

          <Pressable
            style={styles.tabItem}
            onPress={() => setActiveTab('account')}
            android_ripple={{ color: '#E5E7EB', borderless: true }}
          >
            <View style={[styles.tabIconWrap, activeTab === 'account' && styles.tabIconWrapActive]}>
              <Text style={styles.tabIcon}>👤</Text>
            </View>
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'account' && styles.tabLabelActive,
              ]}
            >
              Account
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  main: {
    flex: 1,
  },
  tabBar: {
    height: 66,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 6,
    paddingTop: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrap: {
    width: 38,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabIconWrapActive: {
    backgroundColor: '#DCFCE7',
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#16A34A',
    fontWeight: '700',
  },
});
