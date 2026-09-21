/**
 * STAPLE LIMITED — LocationSelectScreen (Mobile)
 * GPS detection, manual hierarchical selection, and collection point discovery (Spec §5, §47)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { theme } from '../theme/tokens';
import {
  Typography,
  Button,
  Card,
  Badge,
  Header,
} from '../components/index';
import { LocationPicker, SelectedLocationData } from '../components/LocationPicker';
import { useLocation, detectLocation } from '../services/location';
import { formatOperatingHours } from '@staple/shared';

export interface LocationSelectScreenProps {
  onBack?: () => void;
  onLocationSaved?: () => void;
}

export const LocationSelectScreen: React.FC<LocationSelectScreenProps> = ({
  onBack,
  onLocationSaved,
}) => {
  const { location, shortLabel, breadcrumb, setLocation } = useLocation();
  const [isDetecting, setIsDetecting] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleAutoDetectGPS = async () => {
    setIsDetecting(true);
    try {
      // Simulating GPS coordinates for Lekki / VI
      const lat = 6.4474;
      const lng = 3.4735;
      const res = await detectLocation(lat, lng);

      if (res.service_area) {
        setLocation({
          serviceArea: res.service_area,
          city: res.city,
          district: res.district,
          state: res.state,
          country: res.country,
          nearestCollectionPoints: res.nearest_collection_points,
          selectedCollectionPoint: res.nearest_collection_points[0] || null,
          isAutoDetected: true,
          latitude: lat,
          longitude: lng,
        });
        Alert.alert(
          'Location Detected! 📍',
          `We found you in ${res.service_area.name}, ${res.state?.name || 'Lagos'}. Showing nearby collection hubs.`,
        );
      }
    } catch (err) {
      Alert.alert('Detection Failed', 'Could not detect location. Please choose manually.');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleManualSelect = (data: SelectedLocationData) => {
    setLocation({
      serviceArea: {
        id: data.areaId,
        city_locality_id: '00000000-0000-0000-0003-000000000001',
        name: data.areaName,
        description: null,
        radius_km: 8,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      isAutoDetected: false,
    });
  };

  return (
    <View style={styles.container}>
      <Header
        title="Delivery & Hub Location"
        showBack={!!onBack}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Intro */}
        <Typography variant="body" color={theme.textSecondary} style={{ marginBottom: 16 }}>
          Group Buys on <Text style={{ fontWeight: 'bold', color: theme.brandGreen }}>staple</Text> are organized by local hubs. Choose your neighborhood to discover deals and pickup points near you.
        </Typography>

        {/* Current Active Location Card */}
        <Card style={styles.activeCard}>
          <View style={styles.activeCardHeader}>
            <View style={{ flex: 1 }}>
              <Typography variant="caption" color={theme.textMuted}>
                CURRENT SELECTED AREA
              </Typography>
              <Typography variant="h2" color={theme.brandGreen} style={{ marginTop: 2 }}>
                {shortLabel}
              </Typography>
            </View>
            <Badge
              label={location.isAutoDetected ? 'GPS Auto' : 'Manual'}
              variant={location.isAutoDetected ? 'info' : 'neutral'}
            />
          </View>
          <Text style={styles.breadcrumbText}>{breadcrumb}</Text>
        </Card>

        {/* Action Buttons */}
        <View style={styles.btnRow}>
          <Button
            title={isDetecting ? 'Detecting GPS...' : '📍 Use Current GPS'}
            variant="primary"
            size="lg"
            loading={isDetecting}
            onPress={handleAutoDetectGPS}
            style={{ marginBottom: 10 }}
          />

          <Button
            title="🔍 Choose State / LGA Manually"
            variant="outline"
            size="lg"
            onPress={() => setPickerVisible(true)}
          />
        </View>

        {/* Nearest Collection Hubs Section */}
        <View style={styles.hubsSection}>
          <Typography variant="h3" style={{ marginBottom: 4 }}>
            Available Pickup Hubs
          </Typography>
          <Typography variant="caption" color={theme.textSecondary} style={{ marginBottom: 12 }}>
            Free pickup for all Group Buy participants at designated staple hubs
          </Typography>

          {location.nearestCollectionPoints.map((hub) => (
            <Card key={hub.id} style={styles.hubCard}>
              <View style={styles.hubHeader}>
                <Typography variant="label" color={theme.textPrimary}>
                  {hub.name}
                </Typography>
                <Badge label="Official Hub" variant="success" />
              </View>

              <Text style={styles.hubAddress}>📍 {hub.address}</Text>

              {hub.operating_hours && (
                <Text style={styles.hubHours}>
                  🕒 {formatOperatingHours(hub.operating_hours)}
                </Text>
              )}

              {hub.contact_phone && (
                <Text style={styles.hubContact}>
                  📞 Hub Manager: {hub.contact_name} ({hub.contact_phone})
                </Text>
              )}
            </Card>
          ))}
        </View>

        {/* Confirmation */}
        <Button
          title="Confirm & Browse Deals"
          variant="primary"
          size="lg"
          onPress={() => {
            if (onLocationSaved) onLocationSaved();
            else if (onBack) onBack();
          }}
          style={{ marginTop: 24, marginBottom: 32 }}
        />
      </ScrollView>

      <LocationPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleManualSelect}
        currentAreaId={location.serviceArea?.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 16,
  },
  activeCard: {
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.brandGreen,
    marginBottom: 16,
  },
  activeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  breadcrumbText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 6,
  },
  btnRow: {
    marginBottom: 20,
  },
  hubsSection: {
    marginTop: 8,
  },
  hubCard: {
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
  },
  hubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hubAddress: {
    fontSize: 13,
    color: theme.textPrimary,
    marginBottom: 4,
  },
  hubHours: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 2,
  },
  hubContact: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
  },
});
