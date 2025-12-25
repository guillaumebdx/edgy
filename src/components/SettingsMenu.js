/**
 * SettingsMenu Component
 * Simple settings overlay with sound toggle, credits, and reset options
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';

/**
 * Settings Menu Component
 * @param {boolean} visible - Whether the menu is visible
 * @param {Function} onClose - Callback to close the menu
 * @param {boolean} soundEnabled - Current sound state
 * @param {Function} onToggleSound - Callback to toggle sound
 * @param {Function} onResetProgress - Callback to reset all progress
 */
const SettingsMenu = ({
  visible,
  onClose,
  soundEnabled,
  onToggleSound,
  onResetProgress,
}) => {
  const [showCredits, setShowCredits] = useState(false);

  const handleResetPress = () => {
    Alert.alert(
      'Recommencer à zéro',
      'Es-tu sûr de vouloir réinitialiser toute ta progression ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: () => {
            onResetProgress();
            onClose();
          },
        },
      ]
    );
  };

  if (showCredits) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCredits(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.creditsContainer}>
            <Text style={styles.creditsText}>
              App construite avec ❤️ par{'\n'}Guillaume HARARI{'\n'}(vibe codé 😉)
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowCredits(false)}
            >
              <Text style={styles.backButtonText}>← Retour</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.menuContainer}>
          <Text style={styles.title}>Paramètres</Text>

          {/* Sound Toggle */}
          <TouchableOpacity style={styles.menuItem} onPress={onToggleSound}>
            <Text style={styles.menuItemText}>Son</Text>
            <View style={[styles.toggle, soundEnabled && styles.toggleOn]}>
              <Text style={styles.toggleText}>{soundEnabled ? 'ON' : 'OFF'}</Text>
            </View>
          </TouchableOpacity>

          {/* Credits */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setShowCredits(true)}
          >
            <Text style={styles.menuItemText}>Crédits</Text>
            <Text style={styles.menuItemArrow}>→</Text>
          </TouchableOpacity>

          {/* Reset Progress */}
          <TouchableOpacity style={styles.menuItem} onPress={handleResetPress}>
            <Text style={[styles.menuItemText, styles.dangerText]}>
              Recommencer à zéro
            </Text>
          </TouchableOpacity>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
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
  },
  menuContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(100, 160, 180, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e0e0e0',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 2,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 160, 180, 0.2)',
  },
  menuItemText: {
    fontSize: 18,
    color: '#c0c0c0',
  },
  menuItemArrow: {
    fontSize: 18,
    color: 'rgba(100, 160, 180, 0.6)',
  },
  dangerText: {
    color: '#e74c3c',
  },
  toggle: {
    backgroundColor: 'rgba(100, 100, 100, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  toggleOn: {
    backgroundColor: 'rgba(100, 180, 100, 0.4)',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e0e0e0',
  },
  closeButton: {
    marginTop: 24,
    backgroundColor: 'rgba(100, 160, 180, 0.2)',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: 'rgba(100, 160, 180, 0.8)',
    fontWeight: '600',
  },
  creditsContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 32,
    width: '85%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: 'rgba(100, 160, 180, 0.3)',
    alignItems: 'center',
  },
  creditsText: {
    fontSize: 18,
    color: '#c0c0c0',
    textAlign: 'center',
    lineHeight: 28,
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: 'rgba(100, 160, 180, 0.8)',
  },
});

export default SettingsMenu;
