/**
 * STAPLE LIMITED — WalletScreen (Mobile)
 * Shows wallet balance, bank transfer funding details, and transaction history.
 * Manual payment MVP: user pays to STAPLE bank account, sends proof via in-app chat.
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { theme } from '../theme/tokens';
import { Typography, Card, Button } from '../components/index';
import { WalletEntrySide, WalletTransactionType, formatNaira } from '@staple/shared';

export interface WalletScreenProps {
  onSendProofToAdmin?: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({ onSendProofToAdmin }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const wallet = {
    balance: 12500,
    currencyCode: 'NGN',
  };

  // STAPLE bank account details for manual transfer
  const bankDetails = {
    bankName: 'Zenith Bank',
    accountName: 'STAPLE LIMITED',
    accountNumber: '1012345678',
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

  const handleCopy = (text: string, fieldName: string) => {
    // In production, use Clipboard.setStringAsync from expo-clipboard
    setCopiedField(fieldName);
    Alert.alert('Copied!', `${fieldName} copied to clipboard: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

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
          <Typography variant="h1" color={theme.colors.neutral[0]} style={styles.balanceAmount}>
            {formatNaira(wallet.balance)}
          </Typography>
          <Typography variant="caption" color={theme.colors.primary[100]} style={styles.policyNote}>
            ℹ Wallet balance is applied automatically at checkout toward eligible group buys.
          </Typography>
        </Card>

        {/* ━━━ FUND WALLET — BANK TRANSFER DETAILS ━━━ */}
        <Card elevated style={styles.fundCard}>
          <View style={styles.fundHeader}>
            <Typography variant="h3" color={theme.textPrimary}>
              🏦  Fund Your Wallet
            </Typography>
            <Typography variant="caption" color={theme.textSecondary} style={{ marginTop: 4 }}>
              Transfer money to the STAPLE bank account below, then send proof of payment to Admin.
            </Typography>
          </View>

          {/* Bank Details Section */}
          <View style={styles.bankDetailsBox}>
            {/* Bank Name */}
            <View style={styles.bankRow}>
              <Typography variant="caption" color={theme.textMuted} style={styles.bankLabel}>
                BANK NAME
              </Typography>
              <Typography variant="body" weight="bold" color={theme.textPrimary}>
                {bankDetails.bankName}
              </Typography>
            </View>

            {/* Account Name */}
            <View style={styles.bankRow}>
              <Typography variant="caption" color={theme.textMuted} style={styles.bankLabel}>
                ACCOUNT NAME
              </Typography>
              <Typography variant="body" weight="bold" color={theme.textPrimary}>
                {bankDetails.accountName}
              </Typography>
            </View>

            {/* Account Number (tappable to copy) */}
            <View style={styles.bankRow}>
              <Typography variant="caption" color={theme.textMuted} style={styles.bankLabel}>
                ACCOUNT NUMBER
              </Typography>
              <TouchableOpacity
                style={styles.copyRow}
                onPress={() => handleCopy(bankDetails.accountNumber, 'Account Number')}
                activeOpacity={0.7}
              >
                <Typography variant="h3" color={theme.brandGreen} style={styles.accountNumber}>
                  {bankDetails.accountNumber}
                </Typography>
                <View style={styles.copyBadge}>
                  <Typography variant="caption" color={theme.colors.neutral[0]} weight="bold" style={{ fontSize: 10 }}>
                    {copiedField === 'Account Number' ? '✓ COPIED' : '📋 TAP TO COPY'}
                  </Typography>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Step-by-Step Instructions */}
          <View style={styles.stepsBox}>
            <Typography variant="label" color={theme.textPrimary} style={{ marginBottom: 8 }}>
              How to Fund Your Wallet:
            </Typography>
            <View style={styles.step}>
              <Typography variant="body" weight="bold" color={theme.brandGreen} style={styles.stepNum}>
                1
              </Typography>
              <Typography variant="bodySm" color={theme.textSecondary}>
                Transfer any amount to the bank account above using your banking app or USSD.
              </Typography>
            </View>
            <View style={styles.step}>
              <Typography variant="body" weight="bold" color={theme.brandGreen} style={styles.stepNum}>
                2
              </Typography>
              <Typography variant="bodySm" color={theme.textSecondary}>
                Take a screenshot of your payment receipt / confirmation.
              </Typography>
            </View>
            <View style={styles.step}>
              <Typography variant="body" weight="bold" color={theme.brandGreen} style={styles.stepNum}>
                3
              </Typography>
              <Typography variant="bodySm" color={theme.textSecondary}>
                Tap the button below to send the receipt to STAPLE Admin via in-app chat.
              </Typography>
            </View>
            <View style={styles.step}>
              <Typography variant="body" weight="bold" color={theme.brandGreen} style={styles.stepNum}>
                4
              </Typography>
              <Typography variant="bodySm" color={theme.textSecondary}>
                Admin verifies your payment and credits your wallet — usually within 30 minutes!
              </Typography>
            </View>
          </View>

          {/* Send Proof Button */}
          <Button
            title="📩  Send Proof of Payment to Admin"
            variant="primary"
            size="lg"
            onPress={() => {
              if (onSendProofToAdmin) {
                onSendProofToAdmin();
              } else {
                Alert.alert(
                  'Send Proof of Payment',
                  'Open the Support / Chat tab to send your payment receipt to a STAPLE admin.',
                );
              }
            }}
            style={{ marginTop: 16 }}
          />

          <Typography variant="caption" color={theme.textMuted} style={styles.processingNote}>
            ⏱ Payments are typically verified within 30 minutes during business hours (8 AM – 8 PM WAT).
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
    paddingBottom: theme.spacing[6],
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
  balanceAmount: {
    marginTop: 4,
    marginBottom: 4,
    fontSize: 32,
    letterSpacing: 1,
  },
  policyNote: {
    marginTop: theme.spacing[2],
    lineHeight: theme.typography.lineHeight.sm,
  },
  // ── Fund Wallet Card ──
  fundCard: {
    borderColor: theme.brandGreen,
    borderWidth: 1.5,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[5],
  },
  fundHeader: {
    marginBottom: theme.spacing[3],
  },
  bankDetailsBox: {
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
  },
  bankRow: {
    marginBottom: theme.spacing[3],
  },
  bankLabel: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 2,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  accountNumber: {
    letterSpacing: 2,
  },
  copyBadge: {
    backgroundColor: theme.brandGreen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  stepsBox: {
    marginBottom: theme.spacing[2],
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[2],
    gap: theme.spacing[3],
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary[50],
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
  },
  processingNote: {
    marginTop: theme.spacing[3],
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.sm,
  },
  // ── Transaction History ──
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
