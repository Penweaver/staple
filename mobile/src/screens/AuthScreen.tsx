import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { theme } from '../theme/tokens';

export interface UserSession {
  id: string;
  name: string;
  phone: string;
  email: string;
  hub: string;
  role: 'member' | 'champion';
  isKycVerified: boolean;
}

interface AuthScreenProps {
  onLoginSuccess: (session: UserSession) => void;
  onContinueAsGuest: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onContinueAsGuest,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedHub, setSelectedHub] = useState('Lekki Phase 1 Hub');
  const [loading, setLoading] = useState(false);

  const hubs = [
    'Lekki Phase 1 Hub',
    'Victoria Island Hub',
    'Ikeja GRA Hub',
    'Yaba Tech Hub',
    'Surulere Central Hub',
  ];

  const handleAuthSubmit = () => {
    if (!phone && !email) {
      Alert.alert('Required', 'Please enter your phone number or email address.');
      return;
    }
    if (!password) {
      Alert.alert('Required', 'Please enter your password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        id: 'usr_' + Date.now().toString().slice(-6),
        name: name.trim() || (mode === 'signup' ? 'New Member' : 'Amina Bello'),
        phone: phone.trim() || '08023456789',
        email: email.trim() || 'member@staple.africa',
        hub: selectedHub,
        role: 'member',
        isKycVerified: true,
      });
    }, 600);
  };

  const handleQuickDemoLogin = (preset: 'amina' | 'dele' | 'babajide') => {
    if (preset === 'amina') {
      onLoginSuccess({
        id: 'usr_amina_01',
        name: 'Amina Bello',
        phone: '08034567890',
        email: 'amina.bello@example.ng',
        hub: 'Lekki Phase 1 Hub',
        role: 'member',
        isKycVerified: true,
      });
    } else if (preset === 'dele') {
      onLoginSuccess({
        id: 'usr_dele_champ',
        name: 'Dele Adeleke',
        phone: '08098765432',
        email: 'dele.a@example.ng',
        hub: 'Lekki Phase 1 Hub',
        role: 'champion',
        isKycVerified: true,
      });
    } else {
      onLoginSuccess({
        id: 'usr_babajide_02',
        name: 'Babajide Ogundipe',
        phone: '08123456789',
        email: 'babajide.og@example.ng',
        hub: 'Victoria Island Hub',
        role: 'member',
        isKycVerified: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Brand Top Banner with Horizontal Centralized Logo */}
      <View style={styles.headerBanner}>
        <Image
          source={require('../../assets/logo-horizontal.png')}
          style={styles.brandLogoImage}
          resizeMode="contain"
        />
        <Text style={styles.brandSubtitle}>
          Neighborhood Collective Food Purchasing
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Auth Mode Toggle Pill */}
        <View style={styles.toggleContainer}>
          <Pressable
            style={[
              styles.toggleButton,
              mode === 'signin' && styles.toggleButtonActive,
            ]}
            onPress={() => setMode('signin')}
            android_ripple={{ color: '#E5E7EB' }}
          >
            <Text
              style={[
                styles.toggleText,
                mode === 'signin' && styles.toggleTextActive,
              ]}
            >
              Sign In
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.toggleButton,
              mode === 'signup' && styles.toggleButtonActive,
            ]}
            onPress={() => setMode('signup')}
            android_ripple={{ color: '#E5E7EB' }}
          >
            <Text
              style={[
                styles.toggleText,
                mode === 'signup' && styles.toggleTextActive,
              ]}
            >
              Create Account
            </Text>
          </Pressable>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {mode === 'signin' ? 'Welcome Back!' : 'Join Your Neighborhood Hub'}
          </Text>
          <Text style={styles.formSubtitle}>
            {mode === 'signin'
              ? 'Access your collective purchases, group buys, and wallet.'
              : 'Save up to 35% on food staples by pooling orders with neighbors.'}
          </Text>

          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Amina Bello"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Phone Input with +234 flag */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nigerian Phone Number</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCodeBadge}>
                <Text style={styles.countryCodeText}>🇳🇬 +234</Text>
              </View>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                placeholder="801 234 5678"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. you@example.ng"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Your Collection Hub</Text>
              <View style={styles.hubChipsContainer}>
                {hubs.map((hub) => (
                  <TouchableOpacity
                    key={hub}
                    style={[
                      styles.hubChip,
                      selectedHub === hub && styles.hubChipActive,
                    ]}
                    onPress={() => setSelectedHub(hub)}
                  >
                    <Text
                      style={[
                        styles.hubChipText,
                        selectedHub === hub && styles.hubChipTextActive,
                      ]}
                    >
                      {hub}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Submit Button with Android Ripple */}
          <Pressable
            style={styles.submitButton}
            onPress={handleAuthSubmit}
            android_ripple={{ color: '#15803D' }}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading
                ? 'Processing...'
                : mode === 'signin'
                ? 'Sign In to STAPLE'
                : 'Create Account & Start Saving'}
            </Text>
          </Pressable>
        </View>

        {/* Quick Demo Logins for Easy Tester Verification */}
        <View style={styles.demoSection}>
          <Text style={styles.demoSectionHeader}>⚡ QUICK TESTER LOGINS</Text>
          <Text style={styles.demoSectionSubtitle}>
            Tap any persona below to test immediately without typing:
          </Text>

          <View style={styles.demoButtonsContainer}>
            <TouchableOpacity
              style={styles.demoCard}
              onPress={() => handleQuickDemoLogin('amina')}
            >
              <View style={styles.demoAvatar}>
                <Text style={styles.demoAvatarText}>AB</Text>
              </View>
              <View style={styles.demoDetails}>
                <Text style={styles.demoName}>Amina Bello</Text>
                <Text style={styles.demoSub}>Lekki Phase 1 • Member (₦35,000 Wallet)</Text>
              </View>
              <Text style={styles.demoArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoCard}
              onPress={() => handleQuickDemoLogin('dele')}
            >
              <View style={[styles.demoAvatar, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.demoAvatarText}>⭐</Text>
              </View>
              <View style={styles.demoDetails}>
                <Text style={styles.demoName}>Dele Adeleke</Text>
                <Text style={styles.demoSub}>Lekki Lead Champion • Organizer</Text>
              </View>
              <Text style={styles.demoArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoCard}
              onPress={() => handleQuickDemoLogin('babajide')}
            >
              <View style={[styles.demoAvatar, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.demoAvatarText}>BO</Text>
              </View>
              <View style={styles.demoDetails}>
                <Text style={styles.demoName}>Babajide Ogundipe</Text>
                <Text style={styles.demoSub}>VI Hub • Member (₦120,500 Wallet)</Text>
              </View>
              <Text style={styles.demoArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Guest Option */}
        <TouchableOpacity
          style={styles.guestButton}
          onPress={onContinueAsGuest}
        >
          <Text style={styles.guestButtonText}>
            Continue as Guest (Browse Prices First)
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerBanner: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 44 : 54,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  brandLogoImage: {
    width: 210,
    height: 54,
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#0B1F44',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 18,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeBadge: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRightWidth: 0,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  phoneInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  hubChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  hubChip: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  hubChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  hubChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  hubChipTextActive: {
    color: '#14532D',
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#0B1F44',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  demoSection: {
    marginBottom: 16,
  },
  demoSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  demoSectionSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  demoButtonsContainer: {
    gap: 8,
  },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    elevation: 1,
  },
  demoAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  demoAvatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  demoDetails: {
    flex: 1,
  },
  demoName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  demoSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  demoArrow: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  guestButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  guestButtonText: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '600',
  },
});
