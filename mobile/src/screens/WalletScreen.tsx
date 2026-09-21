import React from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { theme } from '../theme/tokens';
import { Typography, Price, Card } from '../components/index';
import { WalletEntrySide, WalletTransactionType } from '@staple/shared';

export const WalletScreen: React.FC = () => {
  const wallet = {
    balance: 12500,
    currencyCode: 'NGN',
  };

  const sampleTransactions = [
    {
      id: 'tx-1',
      type: WalletTransactionType.CREDIT_PRICE_ADJUSTMENT,
      side: WalletEntrySide.CREDIT,
      amount: 4250,
      description: 'Price Tier Credit: 50kg Rice reached 2.5% tier (2 bags × ₦2,125)',
      date: 'Sep 08, 2026',
    },
    {
      id: 'tx-2',
      type: WalletTransactionType.DEBIT_PURCHASE,
      side: WalletEntrySide.DEBIT,
      amount: 10000,
      description: 'Applied to Order #STP-ORD-20260905-001',
      date: 'Sep 05, 2026',
    },
    {
      id: 'tx-3',
      type: WalletTransactionType.CREDIT_CHAMPION_MILESTONE,
      side: WalletEntrySide.CREDIT,
      amount: 2000,
      description: 'Champion Milestone Bonus: Group Buy #gb-3 reached 100% target',
      date: 'Aug 28, 2026',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Typography variant="h2" style={styles.title}>
          STAPLE Wallet
        </Typography>

        {/* Balance Card */}
        <Card elevated style={styles.balanceCard}>
          <Typography variant="caption" color={theme.colors.primary[100]}>
            AVAILABLE BALANCE
          </Typography>
          <Price
            amount={wallet.balance}
            size="xl"
            color={theme.colors.neutral[0]}
          />
          <Typography variant="caption" color={theme.colors.primary[100]} style={styles.policyNote}>
            ℹ Wallet credits apply automatically at checkout toward eligible group buys. Non-withdrawable to bank in MVP (§24).
          </Typography>
        </Card>

        {/* Split Payment Note (§23) */}
        <Card style={styles.infoCard}>
          <Typography variant="bodySm" weight="bold">
            Automatic Balance Split
          </Typography>
          <Typography variant="caption" color={theme.textSecondary}>
            When checking out, staple automatically applies your ₦{wallet.balance.toLocaleString()} balance first. Any remaining balance is paid securely via Paystack.
          </Typography>
        </Card>

        {/* Transaction History Ledger */}
        <Typography variant="h3" style={styles.sectionTitle}>
          Transaction History
        </Typography>

        {sampleTransactions.map((tx) => {
          const isCredit = tx.side === WalletEntrySide.CREDIT;
          return (
            <Card key={tx.id} style={styles.txCard}>
              <View style={styles.txRow}>
                <View style={styles.txLeft}>
                  <Typography variant="bodySm" weight="bold">
                    {tx.description}
                  </Typography>
                  <Typography variant="caption" color={theme.textMuted}>
                    {tx.date}
                  </Typography>
                </View>

                <Typography
                  variant="body"
                  weight="bold"
                  color={isCredit ? theme.brandGreen : theme.textPrimary}
                >
                  {isCredit ? '+' : '−'}₦{tx.amount.toLocaleString()}
                </Typography>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: theme.spacing[4],
  },
  title: {
    marginBottom: theme.spacing[4],
  },
  balanceCard: {
    backgroundColor: theme.brandGreen,
    borderColor: theme.brandGreenDark,
    padding: theme.spacing[5],
    marginBottom: theme.spacing[4],
  },
  policyNote: {
    marginTop: theme.spacing[3],
    lineHeight: theme.typography.lineHeight.sm,
  },
  infoCard: {
    marginBottom: theme.spacing[4],
  },
  sectionTitle: {
    marginBottom: theme.spacing[3],
  },
  txCard: {
    marginBottom: theme.spacing[2],
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txLeft: {
    flex: 1,
    marginRight: theme.spacing[2],
  },
});
