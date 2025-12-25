# EDGY

**Puzzle game mobile** développé avec React Native & Expo.

*Vibe codé avec ❤️ par Guillaume HARARI*

Reliez des cases identiques sur une grille de circuit électronique, fusionnez-les et déclenchez des destructions en chaîne pour maximiser votre score.

---

## 🎮 Fonctionnalités

- **Tutoriel interactif** — Apprenez les mécaniques pas à pas
- **8 niveaux** de difficulté progressive (4×4 → 7×7)
- **Système d'étoiles** — Jusqu'à 3★ par niveau avec challenges
- **Animation d'entrée** — Les blocs tombent et s'illuminent à chaque niveau
- **Carte de carrière** — Circuit imprimé avec composants électroniques
- **Effets sonores** — Validation, erreur, chute + musique de fond
- **Menu paramètres** — Son, crédits, réinitialisation
- **Sauvegarde automatique** — Progression persistante (SQLite)

---

## 📋 Règles

### Comment jouer
1. **Glissez** le doigt sur des cases adjacentes de **même valeur**
2. **Relâchez** pour valider le chemin
3. Si **longueur du chemin > valeur** → les cases fusionnent
4. Si la **nouvelle valeur > MAX** → destruction !

### Exemple
- 4 cases de valeur 3 → fusionnent en valeur 4
- Si MAX = 3 → les 4 cases sont détruites

### Gravité & Stock
- Les cases au-dessus tombent après destruction
- De nouvelles cases arrivent depuis le stock
- Stock vide + aucun coup possible = Game Over

### Score
- Points = longueur² × cases × combo
- Combos pour destructions consécutives
- Célébrations pour performances exceptionnelles

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
├── App.js                    # Point d'entrée
├── assets/                   # Images, sons, logo
└── src/
    ├── components/           # UI (AnimatedCell, CareerMap, SettingsMenu...)
    ├── hooks/                # useGameState, useCareerState, useTutorialState...
    ├── persistence/          # SQLite storage
    ├── constants.js          # Config (couleurs, animations)
    ├── gameLogic.js          # Règles du jeu
    ├── careerLevels.js       # Définition des niveaux
    └── sounds.js             # Gestion audio
```

---

## 📄 Licence

MIT
