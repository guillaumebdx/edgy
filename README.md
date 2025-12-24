# Edgy Grid

Un jeu de puzzle mobile développé avec **React Native** et **Expo**.

Vibe codé et entièrement inventé par **Guillaume HARARI**

Tracez des chemins sur une grille de circuit logique, fusionnez les modules et déclenchez des réactions en chaîne pour maximiser votre score.

---

## Aperçu

- Grille **6×6** avec des modules numérotés de 1 à 5
- Thème visuel **Circuit / Logique** — les cases ressemblent à des composants électroniques
- Système de **stock limité** (50 cellules) — la partie se termine quand plus aucun coup n'est possible
- **Combos** et **célébrations** pour les performances exceptionnelles

---

## Installation

```bash
# Cloner le repo
git clone <repo-url>
cd edgy-grid

# Installer les dépendances
npm install

# Lancer l'application
npx expo start
```

Scannez le QR code avec **Expo Go** sur votre téléphone, ou :
- `a` → Android (émulateur)
- `i` → iOS (macOS + Xcode)
- `w` → Web

---

## Règles du jeu

### Tracé de chemin
1. **Posez** le doigt sur une case pour démarrer
2. **Glissez** sur les cases adjacentes (8 directions) de **même valeur**
3. **Relâchez** pour valider le chemin

### Validation
- Le chemin est validé si sa **longueur > valeur** des cases
- Exemple : 4 cases de valeur 3 → valide (4 > 3)

### Transformation
- Les cases du chemin prennent la **nouvelle valeur = longueur du chemin**
- Si la nouvelle valeur **> 5** (MAX) → les cases sont **détruites**

### Gravité & Stock
- Après destruction, les cases au-dessus **tombent**
- De nouvelles cases apparaissent depuis le **stock** (50 au départ)
- Quand le stock est vide et qu'aucun coup n'est possible → **Game Over**

### Score & Combo
- **Points** = longueur² × nombre de cases × multiplicateur combo
- **Combo** : augmente à chaque destruction consécutive
- **Célébrations** : mots valorisants pour les longues chaînes (8+), combos (x3+), ou grosses destructions (6+ cases)

---

## Direction artistique

### Thème Circuit / Logique
- Fond avec motif de circuit imprimé discret
- Cases = modules électroniques posés sur un PCB
- Palette fonctionnelle par niveau de charge

### Palette de couleurs

| Valeur | État | Couleur |
|--------|------|---------|
| 1 | Dim | `#2D4048` |
| 2 | Neutre | `#386068` |
| 3 | Actif | `#408888` |
| 4 | Chargé | `#48A090` |
| 5 | Haute charge | `#70D0B0` |

### Animations
- **Sélection** : scale rapide avec léger rebond
- **Destruction** : heartbeat puis disparition
- **Gravité** : chute avec rebond physique
- **Feedback haptique** sur validation et explosion

---

## Technologies

- **React Native** + **Expo**
- **react-native-gesture-handler** — Gestion des gestes tactiles
- **react-native-reanimated** — Animations performantes
- **expo-haptics** — Retour haptique

---

## Architecture

```
edgy-grid/
├── App.js                      # Point d'entrée, UI principale
├── assets/
│   └── background-circuit.png  # Fond circuit
└── src/
    ├── constants.js            # Configuration (grille, couleurs, seuils)
    ├── gameLogic.js            # Logique de jeu (grille, validation, gravité)
    ├── scoreManager.js         # Calcul du score, combos, célébrations
    ├── styles.js               # Styles globaux
    ├── utils.js                # Fonctions utilitaires
    ├── components/
    │   ├── AnimatedCell.js     # Cellule animée
    │   ├── CelebrationText.js  # Texte de célébration
    │   ├── FloatingText.js     # Score flottant
    │   ├── GameOverScreen.js   # Écran de fin
    │   └── index.js            # Exports
    └── hooks/
        ├── useGameState.js     # État centralisé du jeu
        └── index.js            # Exports
```

### Séparation des responsabilités
- **constants.js** : configuration centralisée
- **gameLogic.js** : règles du jeu, aucune dépendance React
- **scoreManager.js** : calculs de score isolés
- **useGameState.js** : état React centralisé
- **components/** : UI pure avec animations

---

## Licence

MIT
