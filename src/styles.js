/**
 * Global Styles
 * Centralized styling for the main App component
 */

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  backgroundImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImageStyle: {
    opacity: 0.15,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '85%',
    marginBottom: 16,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  stockContainer: {
    alignItems: 'center',
  },
  stockText: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.35)',
  },
  stockLabel: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.2)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  comboText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E8943A',
  },
  gridContainer: {
    width: '88%',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    aspectRatio: 1,
    padding: 6,
    backgroundColor: '#1A1A1C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2E',
    position: 'relative',
  },
  connectionsContainer: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    pointerEvents: 'none',
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  menuButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 160, 180, 0.3)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(100, 160, 180, 0.5)',
    gap: 4,
  },
  shuffleButtonDisabled: {
    backgroundColor: 'rgba(80, 80, 80, 0.2)',
    borderColor: 'rgba(80, 80, 80, 0.3)',
  },
  shuffleButtonActive: {
    backgroundColor: 'rgba(100, 200, 180, 0.4)',
    borderColor: 'rgba(100, 200, 180, 0.6)',
  },
  shuffleButtonUrgent: {
    backgroundColor: 'rgba(255, 150, 100, 0.5)',
    borderColor: 'rgba(255, 150, 100, 0.8)',
    borderWidth: 2,
  },
  shuffleIcon: {
    fontSize: 16,
  },
  shuffleCount: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default styles;
