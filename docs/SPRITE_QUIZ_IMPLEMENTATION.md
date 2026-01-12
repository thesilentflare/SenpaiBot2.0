# Sprite Quiz System Implementation

## Overview

The sprite quiz system adds visual Pokemon identification quizzes to the PikaGacha module, running alongside the existing text-based trivia quizzes.

## Schedule

- **Text Quizzes**: :00 and :30 of each hour
- **Sprite Quizzes**: :15 and :45 of each hour
- Total: 4 quizzes per hour (alternating between text and sprite)

## Implementation Details

### 1. Sprite Quiz Configuration (`config/spriteQuizQuestions.ts`)

- **50+ Pokemon sprites** organized by difficulty:
  - **Easy (15)**: Iconic Pokemon like Pikachu, Charizard, Mewtwo, legendary birds
  - **Medium (13)**: Popular but less iconic like Eevolutions, Gyarados, Gen 2 starters
  - **Hard (10)**: Easily confused Pokemon like Weedle, Pidgey, Rattata, Oddish

- **Sprite Sources**:
  - Primary: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`
  - Alternative: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png`

- **Helper Functions**:
  - `getSpriteUrl(pokemonId)`: Get primary sprite URL
  - `getAlternativeSpriteUrl(pokemonId)`: Get high-quality artwork URL
  - `getRandomSpriteQuestion()`: Returns random sprite quiz
  - `getSpriteQuestionByDifficulty(difficulty)`: Returns filtered sprite quiz
  - `checkSpriteAnswer(userAnswer, correctName)`: Validates sprite quiz answers (case-insensitive)

### 2. QuizService Updates (`services/QuizService.ts`)

#### Modified Structure

```typescript
activeQuiz: {
  question: string;
  answer: string;
  messageId: string;
  timeout: NodeJS.Timeout;
  type: 'text' | 'sprite'; // NEW: Track quiz type
}
```

#### New Methods

- **`getNextQuizTime()`**: Calculates next 15-minute interval and determines quiz type
  - :00 and :30 → text quiz
  - :15 and :45 → sprite quiz
- **`postSpriteQuiz()`**: Posts sprite-based quiz with embedded image
  - Fetches Pokemon sprite from PokeAPI
  - Creates embed with sprite image
  - Sets up timeout and answer tracking

#### Updated Methods

- **`scheduleNextQuiz()`**: Now schedules both text and sprite quizzes at appropriate times
- **`checkQuizAnswer()`**: Routes to correct validator based on quiz type
  - Text quizzes: Use `checkAnswer()` (fuzzy matching)
  - Sprite quizzes: Use `checkSpriteAnswer()` (exact name matching)
- **`triggerQuiz(type?)`**: Admin command now supports optional type parameter

### 3. Admin Command Updates (`commands/admin.ts`)

#### Updated Command

```
!pg admin triggerquiz [text|sprite]
```

- **No argument**: Randomly selects text or sprite quiz
- **`text`**: Forces text-based trivia quiz
- **`sprite`**: Forces sprite-based visual quiz

## Reward Structure

- Same as text quizzes: **20-60 pikapoints** based on streak
- Streaks apply across both quiz types (unified streak system)
- Streak bonuses:
  - 3 correct: Pokeball
  - 5 correct: Greatball
  - 7 correct: Ultraball
  - 10 correct: Masterball

## User Experience

### Text Quiz Example

```
🧠 PikaGacha Quiz!

What type is super effective against Water-type Pokemon?

Difficulty: EASY
Category: Type Matchups

Reply with your answer within 60 seconds!
Correct answers earn 20-60 pikapoints based on your streak!
```

### Sprite Quiz Example

```
👁️ Who's That Pokemon?!

Identify this Pokemon!

Difficulty: MEDIUM
Generation: 1

[IMAGE: Sprite of mystery Pokemon]

Reply with the name within 60 seconds!
Correct answers earn 20-60 pikapoints based on your streak!
```

## Technical Notes

### Sprite URLs

- Uses PokeAPI's GitHub-hosted sprites for reliability
- Images are embedded directly in Discord embeds (no file upload needed)
- Fallback to alternative artwork URL if primary fails

### Answer Validation

- **Text quizzes**: Fuzzy matching (handles typos, case-insensitive)
- **Sprite quizzes**: Exact name matching (case-insensitive, whitespace-trimmed)
  - "Charizard" ✓
  - "charizard" ✓
  - "CHARIZARD" ✓
  - "Charzard" ✗ (typo)

### Difficulty Distribution

Sprite quizzes use difficulty to balance:

- **Easy**: Players should recognize immediately (90%+ success rate)
- **Medium**: Requires some Pokemon knowledge (60-80% success rate)
- **Hard**: Challenging identifications (30-50% success rate)

## Future Enhancements

Potential improvements:

1. **Silhouette mode**: Show black silhouette instead of colored sprite (harder)
2. **Regional variants**: Include Alolan/Galarian forms
3. **Shiny sprites**: Occasionally show shiny versions for bonus points
4. **Cropped sprites**: Show only part of the Pokemon (harder)
5. **Separate streak tracking**: Different streaks for text vs sprite quizzes
6. **Leaderboards**: Track best sprite quiz performers

## Files Modified

- `config/spriteQuizQuestions.ts` (NEW): Sprite quiz database
- `services/QuizService.ts`: Dual quiz type support
- `commands/admin.ts`: Updated triggerquiz command

## Testing

To test the sprite quiz system:

```
!pg admin triggerquiz sprite
```

This will trigger a sprite quiz in 10 seconds for immediate testing.
