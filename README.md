# Edgy Grid

Un jeu de puzzle mobile développé avec **React Native** et **Expo**.

Vibe codé et entièrement inventé par **Guillaume HARARI**

Tracez des chemins sur une grille de circuit logique, fusionnez les modules et déclenchez des réactions en chaîne pour maximiser votre score.

---

## Aperçu

- **Mode Carrière** avec 5 niveaux progressifs
- Grilles de **4×4 à 6×6** selon le niveau
- Thème visuel **Circuit / Logique** — les cases ressemblent à des composants électroniques
- **Carte de carrière** interactive avec composants électroniques (LED, résistance, transistor...)
- **Persistance SQLite** — reprenez votre progression après fermeture de l'app
- Système de **stock limité** — la partie se termine quand plus aucun coup n'est possible ou quand le score cible est atteint
- **Combos** et **célébrations** pour les performances exceptionnelles

---

## Mode Carrière

### 5 Niveaux progressifs

| Niveau | Nom | Grille | Max | Stock | Objectif |
|--------|-----|--------|-----|-------|----------|
| 1 | Initiation | 4×4 | 3 | 30 | 200 pts |
| 2 | Circuits simples | 5×5 | 4 | 40 | 500 pts |
| 3 | Logique avancée | 6×6 | 4 | 45 | 1000 pts |
| 4 | Haute tension | 6×6 | 5 | 50 | 2000 pts |
| 5 | Maître du circuit | 6×6 | 5 | 40 | 3500 pts |

### Progression
- Atteignez le **score cible** pour débloquer le niveau suivant
- Le niveau se termine **immédiatement** quand l'objectif est atteint
- Rejouez les niveaux précédents sans affecter votre progression
- Votre avancement est **sauvegardé automatiquement** en SQLite

### Carte de carrière
- Menu principal sous forme de **circuit imprimé stylisé**
- Chaque niveau représenté par un **composant électronique** unique
- Connexions visuelles entre les niveaux (traces de circuit)
- États visuels : complété (✓), courant (point lumineux), verrouillé (grisé)

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
- Si la nouvelle valeur **> MAX** → les cases sont **détruites**

### Gravité & Stock
- Après destruction, les cases au-dessus **tombent**
- De nouvelles cases apparaissent depuis le **stock**
- Quand le stock est vide et qu'aucun coup n'est possible → **Game Over**

### Score & Combo
- **Points** = longueur² × nombre de cases × multiplicateur combo
- **Combo** : augmente à chaque destruction consécutive
- **Célébrations** : mots valorisants pour les longues chaînes (8+), combos (x3+), ou grosses destructions (6+ cases)

---

## Direction artistique

### Thème Circuit / Logique
- Fond avec motif de circuit imprimé
- Cases = modules électroniques posés sur un PCB
- Carte de carrière = circuit avec composants (LED, résistance, transistor)
- Connexions bleues luminescentes entre les niveaux

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
- **expo-sqlite** — Persistance locale de la progression

---

## Architecture

```
edgy-grid/
├── App.js                      # Point d'entrée, navigation menu/jeu
├── assets/
│   ├── background-circuit.png  # Fond jeu
│   ├── background-menu.png     # Fond menu
│   ├── led.png                 # Composant niveau 1
│   ├── resistance.png          # Composant niveau 2
│   ├── transistor.png          # Composant niveau 3
│   ├── 2branches.png           # Composant niveau 4
│   └── 3branches.png           # Composant niveau 5
└── src/
    ├── constants.js            # Configuration (grille, couleurs, seuils)
    ├── gameLogic.js            # Logique de jeu (grille, validation, gravité)
    ├── scoreManager.js         # Calcul du score, combos, célébrations
    ├── careerLevels.js         # Définition des 5 niveaux de carrière
    ├── styles.js               # Styles globaux
    ├── utils.js                # Fonctions utilitaires
    ├── components/
    │   ├── AnimatedCell.js     # Cellule animée
    │   ├── CareerMap.js        # Carte de carrière (menu principal)
    │   ├── CelebrationText.js  # Texte de célébration
    │   ├── FloatingText.js     # Score flottant
    │   ├── GameOverScreen.js   # Écran de fin de niveau
    │   ├── LevelInfo.js        # Affichage infos niveau en jeu
    │   └── index.js            # Exports
    ├── hooks/
    │   ├── useGameState.js     # État centralisé du jeu
    │   ├── useCareerState.js   # Gestion progression carrière
    │   └── index.js            # Exports
    └── persistence/
        ├── careerStorage.js    # API SQLite pour sauvegarde
        └── index.js            # Exports
```

### Séparation des responsabilités
- **constants.js** : configuration centralisée
- **gameLogic.js** : règles du jeu, aucune dépendance React
- **scoreManager.js** : calculs de score isolés
- **careerLevels.js** : définition statique des niveaux
- **useGameState.js** : état React du jeu en cours
- **useCareerState.js** : progression carrière + persistance SQLite
- **persistence/** : couche d'accès SQLite isolée
- **components/** : UI pure avec animations

---

## Licence

MIT
