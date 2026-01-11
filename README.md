# EDGY

**Puzzle game mobile** développé avec React Native & Expo.

*Vibe codé avec ❤️ par Guillaume HARARI*

Reliez des cases identiques sur une grille de circuit électronique, fusionnez-les et déclenchez des destructions en chaîne pour maximiser votre score.

📲 Télécharger sur l’App Store : https://apps.apple.com/us/app/edgy/id6757022073

---

## 🎮 Fonctionnalités

- **Tutoriel interactif** — Apprenez les mécaniques pas à pas avec guide visuel
- **20 niveaux** de difficulté progressive (4×4 → 7×7)
- **Mode Libre** — Jouez sans limite pour battre votre high score
- **Système d'étoiles** — Jusqu'à 3★ par niveau avec challenges
- **Cellules Glitch** — Cases non-sélectionnables qui bloquent les chemins
- **Power-ups** — Short Circuit (destruction) et Reprogram (modification)
- **Animation d'entrée** — Les blocs tombent et s'illuminent à chaque niveau
- **Carte de carrière** — Circuit imprimé avec composants électroniques
- **Effets sonores** — Validation, erreur, chute + musique de fond
- **Retour haptique** — Vibrations pour les actions importantes
- **Menu paramètres** — Son, crédits, réinitialisation
- **Sauvegarde automatique** — Progression persistante (SQLite)
- **Multilingue** — Support FR, EN, DE, ES, IT, PT

---

## 📋 Règles

### Comment jouer
1. **Glissez** le doigt sur des cases adjacentes de **même valeur**
2. **Relâchez** pour valider le chemin
3. Si **longueur du chemin > valeur** → les cases fusionnent
4. Si la **nouvelle valeur > MAX** → destruction !
5. **Demi-tour** — Revenez sur la case précédente pour annuler

### Exemple
- 4 cases de valeur 3 → fusionnent en valeur 4
- Si MAX = 3 → les 4 cases sont détruites

### Gravité & Stock
- Les cases au-dessus tombent après destruction
- De nouvelles cases arrivent depuis le stock
- Stock vide + aucun coup possible = Game Over
- **Shuffle** disponible quand bloqué (limité)

### Score
- Points = longueur² × cases × combo
- Combos pour destructions consécutives
- Célébrations pour performances exceptionnelles

### Mode Libre
- Pas d'objectif de score — jouez pour le high score
- **Bonus +500 points** pour chaque ligne/colonne de valeurs identiques
- Le bonus ne se déclenche qu'une fois par ligne/colonne (jusqu'à ce qu'elle soit cassée)

---

## 🗺️ Mode Carrière

| # | Niveau | Grille | MAX | Stock | Objectif | Challenge |
|---|--------|--------|-----|-------|----------|-----------|
| 0 | Tutoriel | 4×4 | 3 | - | 300 | - |
| 1 | Initiation | 4×4 | 3 | 30 | 200 | - |
| 2 | Circuits simples | 5×5 | 4 | 40 | 500 | - |
| 3 | Logique avancée | 6×6 | 4 | 45 | 1000 | - |
| 4 | Haute tension | 6×6 | 5 | 50 | 2000 | - |
| 5 | Maître du circuit | 6×6 | 5 | 40 | 3500 | - |
| 6 | Colonne parfaite | 6×6 | 5 | 45 | 4000 | Colonne de 5 |
| 7 | Signal fort | 7×7 | 5 | 55 | 5500 | Colonne de 5 |

### Étoiles
- **Niveaux 0-5** : 3★ automatiques à la complétion
- **Niveaux 6+** : 3★ si le challenge est réussi

---

## 🚀 Installation

```bash
git clone https://github.com/guillaumebdx/edgy.git
cd edgy/edgy-grid
npm install
npx expo start
```
(ou npx expo run:android pour lancer depuis un android virtuel sur pc)
**Lancer sur appareil :**
- Scannez le QR code avec Expo Go
- `a` → Android | `i` → iOS | `w` → Web

---

## 🛠️ Technologies

| Techno | Usage |
|--------|-------|
| React Native + Expo | Framework mobile |
| react-native-reanimated | Animations fluides |
| react-native-gesture-handler | Gestes tactiles |
| expo-sqlite | Persistance locale |
| expo-av | Audio |
| expo-haptics | Retour haptique |
| AsyncStorage | Préférences utilisateur |

---

## 📁 Structure

```
edgy-grid/
├── App.js                    # Point d'entrée principal
├── app.json                  # Configuration Expo
├── assets/                   # Images, sons, icônes
│   ├── logo.png
│   ├── background-*.png
│   ├── glitch.png
│   └── sounds/
└── src/
    ├── components/           # Composants UI
    │   ├── AnimatedCell.js       # Cellule avec animations
    │   ├── CareerMap.js          # Carte de progression
    │   ├── CelebrationText.js    # Animations de célébration
    │   ├── FloatingText.js       # Texte flottant (scores)
    │   ├── GameOverScreen.js     # Écran de fin de partie
    │   ├── LevelInfo.js          # Informations du niveau
    │   ├── MainMenu.js           # Menu principal
    │   ├── PathCounter.js        # Compteur de chemin
    │   ├── SettingsMenu.js       # Menu paramètres
    │   ├── StockPreview.js       # Aperçu des cellules
    │   └── TutorialOverlay.js    # Overlay du tutoriel
    ├── hooks/                # Hooks React personnalisés
    │   ├── useCareerState.js     # État de la carrière
    │   ├── useGameState.js       # État du jeu principal
    │   ├── useLevelEntryAnimation.js  # Animation d'entrée
    │   ├── useTranslation.js     # Traductions i18n
    │   └── useTutorialState.js   # État du tutoriel
    ├── locales/              # Fichiers de traduction
    │   ├── fr.json               # Français
    │   ├── en.json               # Anglais
    │   ├── de.json               # Allemand
    │   ├── es.json               # Espagnol
    │   ├── it.json               # Italien
    │   └── pt.json               # Portugais
    ├── persistence/          # Stockage SQLite
    │   └── careerStorage.js      # Sauvegarde progression
    ├── careerLevels.js       # Définition des 20 niveaux
    ├── constants.js          # Constantes (couleurs, animations, valeurs)
    ├── gameLogic.js          # Logique du jeu (fusion, gravité, chemins)
    ├── levelAssets.js        # Mapping des images de niveaux
    ├── scoreManager.js       # Gestion des scores et combos
    ├── sounds.js             # Gestion audio
    ├── styles.js             # Styles globaux
    └── utils.js              # Fonctions utilitaires
```

---

## 📄 Licence

MIT

---

## 📝 Changelog

### Version 1.4.0 (10 janvier 2026)
- **Nouveau type de cellule : Glitch** — Cases non-sélectionnables qui bloquent les chemins et tombent avec la gravité
- **Niveau 20 "Interférences"** — Nouveau niveau avec 2 glitches, 1 short circuit et 1 reprogram
- **Protection des glitches** — Impossible de modifier ou détruire les glitches avec reprogram/short circuit (feedback visuel de rejet)
- **Persistance du scroll** — La position de défilement sur la carte des niveaux est conservée lors du retour au menu
- **Traductions complètes** — Support multilingue pour le niveau 20 (français, anglais, allemand, espagnol, italien, portugais)
- **Corrections de bugs** — Résolution d'erreurs liées à l'ordre des hooks React

### Version 1.3.0 (9 janvier 2026)
- **Internationalisation (i18n)** — Support complet de 6 langues : français, anglais, allemand, espagnol, italien, portugais
- **Réinitialisation du high score** — Nouvelle option dans les paramètres pour réinitialiser le meilleur score en mode libre
- **Améliorations UI** — Interface traduite dynamiquement selon la langue du système

### Version 1.2.0 (4-5 janvier 2026)
- **Power-up : Short Circuit** — Nouvelle capacité pour détruire une cellule spécifique
- **Power-up : Reprogram** — Nouvelle capacité pour modifier la valeur d'une cellule
- **Aperçu des prochaines cellules** — Visualisation de la ligne de preview en bas de la grille
- **Règles détaillées** — Ajout d'un écran explicatif des règles du jeu
- **Améliorations générales** — Optimisations et corrections de bugs

### Version 1.1.0 (27-29 décembre 2025)
- **Système de bonus** — +500 points pour chaque ligne/colonne complète de valeurs identiques
- **Compteur de stock** — Affichage du nombre de cellules restantes
- **Stabilité améliorée** — Corrections de bugs critiques et optimisations de performance
- **Améliorations visuelles** — Animations et feedback utilisateur améliorés

### Version 1.0.0 (24-26 décembre 2025)
- **Mode Carrière** — 8 niveaux de difficulté progressive avec système d'étoiles
- **Tutoriel interactif** — Guide pas à pas pour apprendre les mécaniques
- **Carte de progression** — Interface de circuit imprimé avec composants électroniques
- **Système de shuffle** — Mélange de la grille quand aucun coup n'est possible
- **Effets sonores** — Sons pour validation, erreur, chute et musique de fond
- **Retour haptique** — Vibrations pour les actions importantes
- **Menu paramètres** — Gestion du son, crédits et réinitialisation
- **Sauvegarde automatique** — Persistance de la progression avec SQLite
- **Système de challenges** — Objectifs spéciaux pour certains niveaux (colonnes parfaites)
- **Mode Libre** — Jeu sans limite avec high score
- **Animations fluides** — Entrée de niveau, chute des cellules, célébrations
- **Mécaniques de base** — Fusion de cellules, gravité, combos, scoring
