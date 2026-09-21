/**
 * STAPLE LIMITED — Live Community Chat Screen (Phase 8)
 * Participation-gated group buy live discussion (Spec §41 & §42).
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../theme/tokens.js';
import { Typography, Card, Button, Header } from '../components/index.js';

export interface ChatMessageItem {
  id: string;
  senderName: string;
  senderRole: string;
  isChampion: boolean;
  isMe: boolean;
  content: string;
  time: string;
}

export const ChatScreen: React.FC<{
  groupBuyTitle?: string;
  groupBuySlug?: string;
  isEligible?: boolean;
  onBack?: () => void;
  onJoinGroupBuy?: () => void;
}> = ({
  groupBuyTitle = 'Mama Gold Rice (50kg) — Lekki Phase 1',
  groupBuySlug = 'mama-gold-rice-lekki',
  isEligible = true,
  onBack,
  onJoinGroupBuy,
}) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'm-1',
      senderName: 'Dele A.',
      senderRole: 'champion',
      isChampion: true,
      isMe: false,
      content: 'Good morning neighbors! We need just 12 more bags to unlock the next 2.5% discount tier. Please share the WhatsApp link with your estate groups!',
      time: '08:45 AM',
    },
    {
      id: 'm-2',
      senderName: 'Ngozi O.',
      senderRole: 'user',
      isChampion: false,
      isMe: false,
      content: 'Just ordered 2 bags! When will the goods arrive at the Admiralty hub once the target is reached?',
      time: '09:12 AM',
    },
    {
      id: 'm-3',
      senderName: 'Dele A.',
      senderRole: 'champion',
      isChampion: true,
      isMe: false,
      content: 'Delivery happens within 48 hours of target completion. staple logistics delivers directly to the hub for staging.',
      time: '09:15 AM',
    },
    {
      id: 'm-4',
      senderName: 'You',
      senderRole: 'user',
      isChampion: false,
      isMe: true,
      content: 'Can someone else pick up on my behalf with my pickup code?',
      time: '09:30 AM',
    },
    {
      id: 'm-5',
      senderName: 'Dele A.',
      senderRole: 'champion',
      isChampion: true,
      isMe: false,
      content: 'Yes! Just share your 6-digit pickup code or pass with your driver or proxy. The hub manager will verify it at the counter.',
      time: '09:32 AM',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      senderName: 'You',
      senderRole: 'user',
      isChampion: false,
      isMe: true,
      content: inputMessage.trim(),
      time: 'Just now',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header locationName="Live Group Discussion" />

      {/* Group Buy Context Bar */}
      <View style={styles.contextBar}>
        <View style={{ flex: 1 }}>
          <Typography variant="body" weight="bold" numberOfLines={1}>
            {groupBuyTitle}
          </Typography>
          <Typography variant="caption" color={theme.brandGreen} weight="medium">
            🟢 Active Discussion • 18 Participants
          </Typography>
        </View>
        {onBack && (
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Typography variant="body" color={theme.textSecondary}>
              Back
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      {!isEligible ? (
        /* Participation Gate Locked State (Spec §41) */
        <View style={styles.lockedContainer}>
          <Card elevated style={styles.lockedCard}>
            <Typography variant="h1" style={styles.lockedIcon}>
              🔒
            </Typography>
            <Typography variant="h3" style={styles.lockedTitle}>
              Participation-Gated Live Chat
            </Typography>
            <Typography variant="bodySm" color={theme.textSecondary} style={styles.lockedText}>
              In accordance with staple community guidelines (Spec §41), live discussions are reserved for verified participants to prevent commercial solicitation and maintain trust.
            </Typography>
            <Typography variant="caption" color={theme.colors.primary[800]} weight="bold" style={styles.lockedSub}>
              Order at least 1 unit in this group buy to unlock the live chat with your neighbors.
            </Typography>

            <Button
              title="Join Group Buy to Unlock Chat"
              variant="primary"
              onPress={onJoinGroupBuy}
              fullWidth
              style={styles.unlockBtn}
            />
          </Card>
        </View>
      ) : (
        /* Eligible Active Chat Stream */
        <KeyboardAvoidingView
          style={styles.chatArea}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          >
            {/* Community Notice */}
            <View style={styles.noticeBanner}>
              <Typography variant="caption" color={theme.textSecondary} style={{ textAlign: 'center' }}>
                🤝 Neighborhood Guidelines: Be respectful. Discuss coordination, delivery hubs, and group savings.
              </Typography>
            </View>

            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  msg.isMe ? styles.messageRowMe : styles.messageRowOther,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    msg.isMe ? styles.bubbleMe : styles.bubbleOther,
                  ]}
                >
                  {!msg.isMe && (
                    <View style={styles.senderHeader}>
                      <Typography
                        variant="caption"
                        weight="bold"
                        color={msg.isChampion ? theme.colors.secondary[800] : theme.textPrimary}
                      >
                        {msg.senderName}
                      </Typography>
                      {msg.isChampion && (
                        <View style={styles.championBadge}>
                          <Typography variant="caption" color={theme.colors.neutral[0]} weight="bold" style={{ fontSize: 10 }}>
                            ⭐ CHAMPION
                          </Typography>
                        </View>
                      )}
                    </View>
                  )}

                  <Typography
                    variant="bodySm"
                    color={msg.isMe ? theme.colors.neutral[0] : theme.textPrimary}
                  >
                    {msg.content}
                  </Typography>

                  <Typography
                    variant="caption"
                    color={msg.isMe ? theme.colors.neutral[200] : theme.textMuted}
                    style={styles.timestamp}
                  >
                    {msg.time}
                  </Typography>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type message to group..."
              placeholderTextColor={theme.textMuted}
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                !inputMessage.trim() && styles.sendBtnDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputMessage.trim()}
              activeOpacity={0.8}
            >
              <Typography variant="body" color={theme.colors.neutral[0]} weight="bold">
                Send
              </Typography>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  contextBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    backgroundColor: theme.colors.surface.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderSubtle,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[4],
  },
  lockedCard: {
    padding: theme.spacing[5],
    alignItems: 'center',
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
  },
  lockedIcon: {
    fontSize: 48,
    marginBottom: theme.spacing[2],
  },
  lockedTitle: {
    color: theme.colors.primary[900],
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  lockedText: {
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  lockedSub: {
    textAlign: 'center',
    marginBottom: theme.spacing[4],
  },
  unlockBtn: {
    marginTop: theme.spacing[2],
  },
  chatArea: {
    flex: 1,
  },
  messagesList: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[6],
  },
  noticeBanner: {
    backgroundColor: theme.colors.neutral[100],
    padding: theme.spacing[2],
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing[4],
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing[3],
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
  },
  bubbleMe: {
    backgroundColor: theme.brandGreen,
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: theme.colors.surface.card,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    borderBottomLeftRadius: 2,
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[1],
  },
  championBadge: {
    backgroundColor: theme.colors.secondary[700],
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[3],
    backgroundColor: theme.colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: theme.borderSubtle,
    gap: theme.spacing[2],
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    fontSize: 14,
    color: theme.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: theme.brandGreen,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
