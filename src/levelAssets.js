/**
 * Level Assets
 * Centralized mapping of level IDs to their component images
 */

// Hardcoded assets for each level (1 unique asset per level)
const LEVEL_IMAGES = {
  0: require('../assets/tuto.png'),
  1: require('../assets/led.png'),
  2: require('../assets/resistance.png'),
  3: require('../assets/transistor.png'),
  4: require('../assets/2branches.png'),
  5: require('../assets/3branches.png'),
  6: require('../assets/pile.png'),
  7: require('../assets/wifi.png'),
  8: require('../assets/_aimant.png'),
  9: require('../assets/_bobine_magnetique.png'),
  10: require('../assets/_composant_bleu.png'),
  11: require('../assets/_concept.png'),
  12: require('../assets/_condensateur_ic.png'),
  13: require('../assets/_double_vis_vert.png'),
  14: require('../assets/_fer_jaune.png'),
  15: require('../assets/_fusible.png'),
};

/**
 * Get the component image for a level
 * @param {number} levelId - Level ID
 * @returns {ImageSource} Image source for the level
 */
export const getLevelImage = (levelId) => {
  return LEVEL_IMAGES[levelId] || LEVEL_IMAGES[0];
};

export default LEVEL_IMAGES;
