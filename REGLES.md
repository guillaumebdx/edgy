# Edgy - Règles du jeu

## Le principe

Edgy est un jeu de puzzle où vous reliez des cases contenant le même chiffre pour marquer des points.

---

## Comment jouer ?

### 1. Relier les cases

Faites glisser votre doigt sur des cases **adjacentes** (horizontalement, verticalement ou en diagonale) qui contiennent le **même chiffre**.

```
Exemple : Reliez quatre "3" adjacents
┌───┬───┬───┐
│ 3 │ 3 │ 2 │
├───┼───┼───┤
│ 1 │ 3 │ 3 │
└───┴───┴───┘
     ↓
Les quatre 3 forment un chemin valide !
```

### 2. La transformation

Quand vous reliez des cases, **chaque case se transforme** en une nouvelle case dont la valeur correspond au **nombre de cases reliées**.

```
Exemple : Vous reliez 4 cases contenant des "3"
         → Chacune des 4 cases devient un "4"
         
Vous reliez 5 cases contenant des "2"
         → Chacune des 5 cases devient un "5"
```

C'est la mécanique clé du jeu : en reliant plusieurs petits chiffres, vous créez des chiffres plus grands !

### 3. Dépasser le maximum = disparition

Chaque niveau a un **chiffre maximum** (ex: MAX = 5). Si la transformation dépasse ce maximum, les cases **disparaissent** au lieu de se transformer.

```
Exemple avec MAX = 5 :
- Vous reliez 6 cases de "3" → Elles devraient devenir des "6"
  Mais 6 > MAX, donc elles disparaissent !
  
- Vous reliez 4 cases de "2" → Elles deviennent des "4" (4 < 5, OK)
```

### 4. La gravité

Quand des cases disparaissent, les cases au-dessus tombent pour combler les trous, et de nouvelles cases arrivent depuis le stock.

---

## Le score

Le score dépend de **deux facteurs** :
- La **valeur du chiffre** relié
- Le **nombre de cases** reliées

**Formule de base :** `valeur × valeur × nombre de cases`

### Exemples

| Chiffre | Cases | Calcul      | Points |
|---------|-------|-------------|--------|
| 2       | 3     | 2 × 2 × 3   | 12 pts |
| 3       | 3     | 3 × 3 × 3   | 27 pts |
| 4       | 2     | 4 × 4 × 2   | 32 pts |
| 5       | 4     | 5 × 5 × 4   | 100 pts |

💡 **Astuce :** Relier des chiffres élevés rapporte beaucoup plus de points !

---

## Le stock

Chaque niveau dispose d'un **stock de cases**. Quand des cases disparaissent, de nouvelles arrivent depuis le stock.

⚠️ **Attention :** Quand le stock est vide, les cases ne sont plus remplacées !

---

## Fin de partie

La partie se termine quand :
- ✅ Vous atteignez le **score objectif** → Victoire !
- ❌ Il n'y a **plus de coups possibles** et le stock est vide → Défaite

---

## Mode Carrière

Progressez à travers des niveaux de difficulté croissante :
- La grille s'agrandit (4×4, 5×5, 6×6...)
- Le chiffre maximum augmente (4, 5, 6...)
- Les objectifs de score augmentent

---

## Mode Libre

Jouez sans limite ! Pas d'objectif, juste votre meilleur score à battre.

### Bonus spéciaux (Mode Libre uniquement)

**Ligne complète :** Créez une ligne horizontale de chiffres identiques → +500 pts + 1 Court-circuit

**Colonne complète :** Créez une colonne verticale de chiffres identiques → +500 pts + 1 Reprogrammation

---

## Pouvoirs spéciaux

### 🔀 Mélange
Mélange toutes les cases de la grille. Utile quand vous êtes bloqué !

### ⚡ Court-circuit
Détruit instantanément une case de votre choix.

### 🔧 Reprogrammation
Change le chiffre d'une case en un autre de votre choix.

---

## Astuces

1. **Cherchez les longues chaînes** - Plus le chemin est long, plus vous gagnez de points
2. **Anticipez la gravité** - Les cases tombent vers le bas après chaque coup
3. **Gardez vos mélanges** - Ne les utilisez que quand vous êtes vraiment bloqué
4. **Visez les lignes/colonnes** - En Mode Libre, les bonus valent le coup !

---

Bonne partie ! 🎮
