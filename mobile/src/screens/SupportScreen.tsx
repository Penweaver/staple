/**
 * STAPLE LIMITED — Customer Support Desk Screen (Phase 8)
 * Self-service help topics, ticket submission, and threaded staff replies.
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert,
} from 'react-native';
import { theme } from '../theme/tokens';
import {
  Typography,
  Card,
  Badge,
  Button,
  Header,
  EmptyState,
} from '../components/index';
import { TicketStatus } from '@staple/shared';

export interface SupportTicketItem {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    senderName: string;
    senderRole: 'user' | 'admin';
    message: string;
    time: string;
  }>;
}

export const SupportScreen: React.FC<{
  onBack?: () => void;
}> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'faq'>('tickets');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);

  // New ticket modal state
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('Order & Fulfilment');
  const [newDescription, setNewDescription] = useState('');

  // Ticket reply input state
  const [replyText, setReplyText] = useState('');

  const [tickets, setTickets] = useState<SupportTicketItem[]>([
    {
      id: 'tck-1',
      ticketNumber: 'STP-TCK-2026-0012',
      subject: 'Proxy pickup authorization for Lekki Hub',
      category: 'Fulfilment',
      status: TicketStatus.IN_PROGRESS,
      createdAt: '2026-09-20 11:20',
      updatedAt: '2026-09-20 14:05',
      messages: [
        {
          id: 'tm-1',
          senderName: 'You',
          senderRole: 'user',
          message: 'Hello, can my domestic staff pick up my 50kg rice order tomorrow morning using my code?',
          time: '11:20 AM',
        },
        {
          id: 'tm-2',
          senderName: 'staple Support (Kemi)',
          senderRole: 'admin',
          message: 'Hello! Yes, absolutely. Simply share your 6-digit pickup pass (STP-XXX-XXX) with your staff. The hub manager will record their name on the terminal upon release.',
          time: '02:05 PM',
        },
      ],
    },
    {
      id: 'tck-2',
      ticketNumber: 'STP-TCK-2026-0008',
      subject: 'Wallet refund confirmation on expired buy',
      category: 'Wallet & Payments',
      status: TicketStatus.RESOLVED,
      createdAt: '2026-09-18 09:15',
      updatedAt: '2026-09-18 10:30',
      messages: [
        {
          id: 'tm-3',
          senderName: 'You',
          senderRole: 'user',
          message: 'The vegetable oil group buy did not reach the minimum quantity. Where is my refund?',
          time: '09:15 AM',
        },
        {
          id: 'tm-4',
          senderName: 'staple Support (Chidi)',
          senderRole: 'admin',
          message: 'Your payment was automatically credited to your staple wallet (₦48,000) under Addendum A2 rules. You can use it immediately on any other active buy.',
          time: '10:30 AM',
        },
      ],
    },
  ]);

  const faqs = [
    {
      q: 'How does collective group buying work on staple?',
      a: 'Neighbors in the same area pool orders together for food essentials. When the target quantity is met, wholesale bulk pricing is locked and goods are delivered to your local collection hub.',
    },
    {
      q: 'What happens if a group buy does not meet its target?',
      a: 'If a group buy expires without reaching the Minimum Viable Fulfilment Quantity (MVFQ), it is closed and 100% of your payment is automatically refunded to your staple wallet.',
    },
    {
      q: 'How do collection hubs work?',
      a: 'Once your group buy is dispatched, you receive a 6-digit pickup code (STP-XXX-XXX) and a digital pass. Visit your designated neighborhood hub during business hours to collect your goods.',
    },
    {
      q: 'What is the Festive & Owambe 7-day grace period?',
      a: 'If an instalment is missed on a seasonal savings plan, you have a 7-day grace period to pay. If unpaid after 7 days, the plan is cancelled and prior payments are forfeited per Spec §35.',
    },
    {
      q: 'How do I become a staple Community Champion?',
      a: 'Visit the Champion tab in the app, review the guidelines, and submit an application with your neighborhood reach. Champions organize buys and earn milestone rewards.',
    },
  ];

  const handleCreateTicket = () => {
    if (!newSubject.trim() || !newDescription.trim()) {
      Alert.alert('Required Fields', 'Please provide a subject and describe your issue.');
      return;
    }

    const seq = tickets.length + 13;
    const newTicket: SupportTicketItem = {
      id: `tck-${Date.now()}`,
      ticketNumber: `STP-TCK-2026-${String(seq).padStart(4, '0')}`,
      subject: newSubject.trim(),
      category: newCategory,
      status: TicketStatus.OPEN,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      messages: [
        {
          id: `tm-${Date.now()}`,
          senderName: 'You',
          senderRole: 'user',
          message: newDescription.trim(),
          time: 'Just now',
        },
      ],
    };

    setTickets([newTicket, ...tickets]);
    setIsCreateModalVisible(false);
    setNewSubject('');
    setNewDescription('');
    Alert.alert(
      'Ticket Submitted 🎉',
      `Ticket #${newTicket.ticketNumber} created. Our team will respond shortly.`
    );
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedTicket) return;

    const newReply = {
      id: `tm-${Date.now()}`,
      senderName: 'You',
      senderRole: 'user' as const,
      message: replyText.trim(),
      time: 'Just now',
    };

    const updated = {
      ...selectedTicket,
      messages: [...selectedTicket.messages, newReply],
      updatedAt: 'Just now',
    };

    setSelectedTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updated : t)));
    setReplyText('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header locationName="Help & Support Desk" />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tickets' && styles.tabActive]}
          onPress={() => setActiveTab('tickets')}
        >
          <Typography
            variant="body"
            weight={activeTab === 'tickets' ? 'bold' : 'regular'}
            color={activeTab === 'tickets' ? theme.brandGreen : theme.textSecondary}
          >
            🎧 Support Tickets ({tickets.length})
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'faq' && styles.tabActive]}
          onPress={() => setActiveTab('faq')}
        >
          <Typography
            variant="body"
            weight={activeTab === 'faq' ? 'bold' : 'regular'}
            color={activeTab === 'faq' ? theme.brandGreen : theme.textSecondary}
          >
            💡 Help Topics & FAQ
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'tickets' ? (
          <>
            {/* Create Ticket Banner */}
            <Card style={styles.actionBanner}>
              <View style={{ flex: 1 }}>
                <Typography variant="body" weight="bold" color={theme.colors.primary[900]}>
                  Need assistance with an order?
                </Typography>
                <Typography variant="caption" color={theme.textSecondary}>
                  Our Lagos & Abuja customer care team replies in under 15 minutes.
                </Typography>
              </View>
              <Button
                title="+ New Ticket"
                variant="primary"
                onPress={() => setIsCreateModalVisible(true)}
              />
            </Card>

            {tickets.length === 0 ? (
              <EmptyState
                title="No Open Tickets"
                description="You don't have any support inquiries. Everything is running smoothly!"
              />
            ) : (
              tickets.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedTicket(t)}
                >
                  <Card elevated style={styles.ticketCard}>
                    <View style={styles.ticketHeader}>
                      <Typography variant="caption" color={theme.textMuted} weight="bold">
                        {t.ticketNumber} • {t.category}
                      </Typography>
                      <View
                        style={[
                          styles.statusBadge,
                          t.status === TicketStatus.RESOLVED
                            ? styles.statusResolved
                            : t.status === TicketStatus.IN_PROGRESS
                            ? styles.statusInProgress
                            : styles.statusOpen,
                        ]}
                      >
                        <Typography
                          variant="caption"
                          weight="bold"
                          color={
                            t.status === TicketStatus.RESOLVED
                              ? theme.colors.success.dark
                              : t.status === TicketStatus.IN_PROGRESS
                              ? theme.colors.warning.dark
                              : theme.colors.primary[800]
                          }
                        >
                          {t.status.toUpperCase()}
                        </Typography>
                      </View>
                    </View>

                    <Typography variant="h3" style={styles.ticketSubject}>
                      {t.subject}
                    </Typography>

                    <View style={styles.ticketFooter}>
                      <Typography variant="caption" color={theme.textSecondary}>
                        💬 {t.messages.length} message(s)
                      </Typography>
                      <Typography variant="caption" color={theme.textMuted}>
                        Updated: {t.updatedAt}
                      </Typography>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          /* FAQs */
          <>
            <Typography variant="h3" style={{ marginBottom: theme.spacing[3] }}>
              Frequently Asked Questions
            </Typography>
            {faqs.map((faq, index) => (
              <Card key={index} style={styles.faqCard}>
                <Typography variant="body" weight="bold" color={theme.colors.primary[900]}>
                  {faq.q}
                </Typography>
                <Typography variant="bodySm" color={theme.textSecondary} style={{ marginTop: 6 }}>
                  {faq.a}
                </Typography>
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      {/* Modal 1: Create Ticket Modal */}
      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Open Support Ticket</Typography>
              <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                <Typography variant="body" weight="bold" color={theme.textMuted}>✕</Typography>
              </TouchableOpacity>
            </View>

            <Typography variant="caption" color={theme.textSecondary} style={{ marginBottom: theme.spacing[3] }}>
              Let us know how we can assist you with your staple experience.
            </Typography>

            <Typography variant="caption" weight="bold" style={styles.inputLabel}>
              Category:
            </Typography>
            <View style={styles.categoryPickerRow}>
              {['Order & Fulfilment', 'Wallet & Payment', 'Festive Plan', 'General'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catBtn, newCategory === cat && styles.catBtnActive]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Typography
                    variant="caption"
                    weight={newCategory === cat ? 'bold' : 'regular'}
                    color={newCategory === cat ? theme.colors.neutral[0] : theme.textSecondary}
                  >
                    {cat}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>

            <Typography variant="caption" weight="bold" style={styles.inputLabel}>
              Subject:
            </Typography>
            <TextInput
              style={styles.modalTextInput}
              placeholder="e.g. Question about Lekki Admiralty Hub pickup"
              placeholderTextColor={theme.textMuted}
              value={newSubject}
              onChangeText={setNewSubject}
            />

            <Typography variant="caption" weight="bold" style={styles.inputLabel}>
              Describe your issue:
            </Typography>
            <TextInput
              style={[styles.modalTextInput, styles.modalTextArea]}
              placeholder="Provide order number or details..."
              placeholderTextColor={theme.textMuted}
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              numberOfLines={4}
            />

            <Button
              title="Submit Ticket"
              variant="primary"
              onPress={handleCreateTicket}
              fullWidth
              style={{ marginTop: theme.spacing[4] }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal 2: Threaded Ticket Viewer Modal */}
      <Modal
        visible={!!selectedTicket}
        animationType="slide"
        onRequestClose={() => setSelectedTicket(null)}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.threadHeader}>
            <TouchableOpacity onPress={() => setSelectedTicket(null)}>
              <Typography variant="body" color={theme.brandGreen} weight="bold">
                ← Back
              </Typography>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Typography variant="body" weight="bold">
                {selectedTicket?.ticketNumber}
              </Typography>
              <Typography variant="caption" color={theme.textSecondary}>
                {selectedTicket?.category}
              </Typography>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.threadMessages} contentContainerStyle={{ padding: theme.spacing[4] }}>
            <Card style={styles.threadSubjectCard}>
              <Typography variant="h3">{selectedTicket?.subject}</Typography>
              <Typography variant="caption" color={theme.textMuted}>
                Created on {selectedTicket?.createdAt}
              </Typography>
            </Card>

            {selectedTicket?.messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.threadMessageRow,
                  m.senderRole === 'user' ? styles.threadRowMe : styles.threadRowOther,
                ]}
              >
                <View
                  style={[
                    styles.threadBubble,
                    m.senderRole === 'user' ? styles.threadBubbleMe : styles.threadBubbleOther,
                  ]}
                >
                  <Typography
                    variant="caption"
                    weight="bold"
                    color={m.senderRole === 'user' ? theme.colors.neutral[0] : theme.brandGreen}
                  >
                    {m.senderName}
                  </Typography>
                  <Typography
                    variant="bodySm"
                    color={m.senderRole === 'user' ? theme.colors.neutral[0] : theme.textPrimary}
                    style={{ marginTop: 2 }}
                  >
                    {m.message}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={m.senderRole === 'user' ? theme.colors.neutral[200] : theme.textMuted}
                    style={styles.timestamp}
                  >
                    {m.time}
                  </Typography>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Reply Bar */}
          <View style={styles.replyBar}>
            <TextInput
              style={styles.replyInput}
              placeholder="Type your reply to staple support..."
              placeholderTextColor={theme.textMuted}
              value={replyText}
              onChangeText={setReplyText}
            />
            <Button
              title="Send"
              variant="primary"
              onPress={handleSendReply}
              disabled={!replyText.trim()}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
    backgroundColor: theme.colors.surface.card,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.brandGreen,
  },
  content: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
    marginBottom: theme.spacing[4],
  },
  ticketCard: {
    marginBottom: theme.spacing[3],
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusResolved: {
    backgroundColor: theme.colors.success.light,
  },
  statusInProgress: {
    backgroundColor: theme.colors.warning.light,
  },
  statusOpen: {
    backgroundColor: theme.colors.primary[100],
  },
  ticketSubject: {
    marginVertical: theme.spacing[1],
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing[2],
  },
  faqCard: {
    marginBottom: theme.spacing[3],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.bg,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  inputLabel: {
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[1],
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: theme.spacing[2],
  },
  catBtn: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.neutral[100],
  },
  catBtnActive: {
    backgroundColor: theme.brandGreen,
  },
  modalTextInput: {
    backgroundColor: theme.colors.surface.card,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing[3],
    fontSize: 14,
    color: theme.textPrimary,
  },
  modalTextArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing[4],
    backgroundColor: theme.colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  threadSubjectCard: {
    backgroundColor: theme.colors.neutral[50],
    marginBottom: theme.spacing[4],
  },
  threadMessages: {
    flex: 1,
  },
  threadMessageRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing[3],
  },
  threadRowMe: {
    justifyContent: 'flex-end',
  },
  threadRowOther: {
    justifyContent: 'flex-start',
  },
  threadBubble: {
    maxWidth: '82%',
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
  },
  threadBubbleMe: {
    backgroundColor: theme.brandGreen,
    borderBottomRightRadius: 2,
  },
  threadBubbleOther: {
    backgroundColor: theme.colors.surface.card,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    borderBottomLeftRadius: 2,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  replyBar: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    padding: theme.spacing[3],
    backgroundColor: theme.colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    alignItems: 'center',
  },
  replyInput: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    fontSize: 14,
    color: theme.textPrimary,
  },
});
