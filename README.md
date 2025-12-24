# 🎮 Edgy Grid

Un jeu de puzzle mobile développé avec **React Native** et **Expo**.

Tracez des chemins sur une grille colorée, fusionnez les cases et déclenchez des réactions en chaîne pour maximiser votre score !

---

## 📱 Aperçu

- Grille **6×6** avec des cases numérotées de 1 à 5
- Tracez des chemins en glissant le doigt sur des cases adjacentes de même valeur
- Les cases fusionnent et prennent la valeur de la longueur du chemin
- Dépassez la valeur maximale (5) pour déclencher une **destruction** avec gravité
- Système de **score** et **combo** pour récompenser les chaînes

---

## 🚀 Installation

```bash
# Cloner le repo
git clone <repo-url>
cd edgy-grid

# Installer les dépendances
npm install

# Lancer l'application
npm start
```

Scannez le QR code avec **Expo Go** sur votre téléphone, ou :
- `a` → Android (émulateur)
- `i` → iOS (macOS + Xcode)
- `w` → Web

---

## 🎯 Règles du jeu

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

### Gravité
- Après destruction, les cases au-dessus **tombent**
- De nouvelles cases apparaissent en haut

### Score & Combo
- **Points** = valeur² × nombre de cases
- **Combo** : multiplicateur qui augmente à chaque destruction consécutive
- Le combo retombe à 0 si aucune destruction n'a lieu

---

## 🎨 Design

| Valeur | Couleur |
|--------|---------|
| 1 | 🔴 Rouge `#E63946` |
| 2 | 🟠 Orange `#F77F00` |
| 3 | 🟢 Vert `#06D6A0` |
| 4 | 🔵 Bleu `#118AB2` |
| 5 | 🟣 Violet `#9D4EDD` |

- Fond sombre `#1a1a1a`
- Animations fluides (gravité avec rebond, shake avant destruction)
- Feedback haptique sur validation et explosion

---

## 🛠️ Technologies

- **React Native** + **Expo**
- **react-native-gesture-handler** — Gestion des gestes tactiles
- **react-native-reanimated** — Animations performantes
- **expo-haptics** — Retour haptique

---

## 📁 Structure

```
edgy-grid/
├── App.js          # Logique principale du jeu
├── package.json    # Dépendances
└── README.md       # Ce fichier
```

---

## 📄 Licence

MIT
