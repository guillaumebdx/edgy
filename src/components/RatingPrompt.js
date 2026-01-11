/**
 * RatingPrompt Component
 * Modal to prompt users to rate the app on App Store / Play Store
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import * as StoreReview from 'expo-store-review';
import { saveRatingStatus } from '../persistence';
import useTranslation from '../hooks/useTranslation';

const RatingPrompt = ({ visible, onClose }) => {
  const { t } = useTranslation();

  const handleRate = async () => {
    await saveRatingStatus('rated');
    onClose();
    
    // Try to use native store review
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }
  };

  const handleLater = async () => {
    await saveRatingStatus('later');
    onClose();
  };

  const handleRefuse = async () => {
    await saveRatingStatus('refused');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleLater}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <Text style={styles.icon}>⭐</Text>
          
          {/* Title */}
          <Text style={styles.title}>{t('rating.title')}</Text>
          
          {/* Message */}
          <Text style={styles.message}>{t('rating.message')}</Text>
          
          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Rate button */}
            <TouchableOpacity
              style={styles.rateButton}
              onPress={handleRate}
              activeOpacity={0.8}
            >
              <Text style={styles.rateButtonText}>{t('rating.rate')}</Text>
            </TouchableOpacity>
            
            {/* Later button */}
            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleLater}
              activeOpacity={0.8}
            >
              <Text style={styles.laterButtonText}>{t('rating.later')}</Text>
            </TouchableOpacity>
            
            {/* Refuse button */}
            <TouchableOpacity
              style={styles.refuseButton}
              onPress={handleRefuse}
              activeOpacity={0.8}
            >
              <Text style={styles.refuseButtonText}>{t('rating.refuse')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 160, 180, 0.3)',
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  rateButton: {
    backgroundColor: 'rgba(0, 191, 255, 0.9)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  laterButton: {
    backgroundColor: 'rgba(80, 100, 120, 0.4)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 160, 180, 0.3)',
  },
  laterButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
  refuseButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  refuseButtonText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '400',
  },
});

export default RatingPrompt;
