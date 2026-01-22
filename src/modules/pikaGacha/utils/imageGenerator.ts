import {
  createCanvas,
  loadImage,
  Image as CanvasImage,
  registerFont,
} from 'canvas';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import Logger from '../../../utils/logger';
import { SPECIAL_POKEMON } from '../types';

// Register font
const fontPath = path.join(__dirname, '../assets/images/arial.ttf');
if (fs.existsSync(fontPath)) {
  registerFont(fontPath, { family: 'Arial' });
}

interface BattleImageData {
  username1: string;
  pokemon1: string;
  pokemon1Plus: string;
  pokemon1Bst: number;
  pokemon1BstBonus: string;
  pokemon1Odds: number;
  pokemon1Id: number;
  balance1: number;
  payout1: number;

  username2: string;
  pokemon2: string;
  pokemon2Plus: string;
  pokemon2Bst: number;
  pokemon2BstBonus: string;
  pokemon2Odds: number;
  pokemon2Id: number;
  balance2: number;
  payout2: number;

  wager: number;
}

/**
 * Generate a battle preview image
 */
export async function generateBattleImage(
  data: BattleImageData,
): Promise<Buffer> {
  const canvas = createCanvas(850, 450);
  const ctx = canvas.getContext('2d');

  try {
    // Load and draw background
    const backgroundPath = path.join(
      __dirname,
      '../assets/images/battle_background.png',
    );
    const background = await loadImage(backgroundPath);
    ctx.drawImage(background, 0, 0, 850, 450);

    // Load and draw Pokemon sprites
    await drawPokemonSprite(ctx, data.pokemon1Id, 50, 225, true); // Player 1 (flipped)
    await drawPokemonSprite(ctx, data.pokemon2Id, 550, 50, false); // Player 2

    // Load and draw text boxes
    const textBoxPath = path.join(
      __dirname,
      '../assets/images/battle_text_box.png',
    );
    const textBox = await loadImage(textBoxPath);
    ctx.drawImage(textBox, 25, 75, 300, 150); // Player 2 box (top left)
    ctx.drawImage(textBox, 525, 275, 300, 150); // Player 1 box (bottom right)

    // Draw title
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Battle!', 425, 35);

    ctx.font = '25px Arial';
    ctx.fillText(`Base Wager: ${data.wager} pikapoints`, 425, 65);

    // Draw VS in middle
    ctx.font = 'bold 50px Arial';
    ctx.fillText('VS', 425, 235);

    // Draw confirmation text
    ctx.font = '15px Arial';
    ctx.fillText(
      'Both players must confirm if they wish for the battle to proceed',
      425,
      275,
    );

    // Populate text boxes
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';

    // Player 2 box (top left)
    ctx.fillText(data.username2, 38, 103);
    ctx.fillText(`${data.pokemon2}${data.pokemon2Plus}`, 38, 123);
    ctx.fillText(`BST: ${data.pokemon2Bst}${data.pokemon2BstBonus}`, 38, 143);
    ctx.fillText(`Odds: ${data.pokemon2Odds}%`, 38, 163);
    ctx.fillText(`Balance: ${data.balance2} pikapoints`, 38, 183);
    ctx.fillText(`Earnings: ${data.payout2} pikapoints`, 38, 203);

    // Player 1 box (bottom right)
    ctx.fillText(data.username1, 538, 303);
    ctx.fillText(`${data.pokemon1}${data.pokemon1Plus}`, 538, 323);
    ctx.fillText(`BST: ${data.pokemon1Bst}${data.pokemon1BstBonus}`, 538, 343);
    ctx.fillText(`Odds: ${data.pokemon1Odds}%`, 538, 363);
    ctx.fillText(`Balance: ${data.balance1} pikapoints`, 538, 383);
    ctx.fillText(`Earnings: ${data.payout1} pikapoints`, 538, 403);

    return canvas.toBuffer('image/png');
  } catch (error) {
    Logger.error('Error generating battle image', error);
    throw error;
  }
}

/**
 * Draw a Pokemon sprite on the canvas
 */
async function drawPokemonSprite(
  ctx: any,
  pokemonId: number,
  x: number,
  y: number,
  flipHorizontal: boolean,
): Promise<void> {
  try {
    let img: CanvasImage;
    let width = 200;
    let height = 200;

    // Special Pokemon (10000+) use URLs
    if (pokemonId >= 10000) {
      const url = SPECIAL_POKEMON[pokemonId];
      if (!url) {
        Logger.warn(`No sprite URL for special pokemon ID ${pokemonId}`);
        return;
      }

      const response = await axios.get(url, { responseType: 'arraybuffer' });
      img = await loadImage(Buffer.from(response.data));

      // Some special pokemon use smaller sprites
      if ([10000, 10006, 10007, 10008].includes(pokemonId)) {
        width = 150;
        height = 150;
      }
    } else {
      // Regular Pokemon - use Serebii sprites
      const spriteUrl = `https://www.serebii.net/pokemon/art/${pokemonId.toString().padStart(3, '0')}.png`;
      try {
        const response = await axios.get(spriteUrl, {
          responseType: 'arraybuffer',
        });
        img = await loadImage(Buffer.from(response.data));
      } catch (error) {
        // Fallback to PokéAPI if Serebii fails
        const fallbackUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
        const response = await axios.get(fallbackUrl, {
          responseType: 'arraybuffer',
        });
        img = await loadImage(Buffer.from(response.data));
      }
    }

    // Create a temporary canvas for the sprite
    const spriteCanvas = createCanvas(width, height);
    const spriteCtx = spriteCanvas.getContext('2d');

    if (flipHorizontal) {
      // Flip horizontally for player 1
      spriteCtx.translate(width, 0);
      spriteCtx.scale(-1, 1);
      spriteCtx.drawImage(img, 0, 0, width, height);
    } else {
      spriteCtx.drawImage(img, 0, 0, width, height);
    }

    // Draw the sprite onto the main canvas
    ctx.drawImage(spriteCanvas, x, y);
  } catch (error) {
    Logger.error(`Error loading sprite for Pokemon ID ${pokemonId}`, error);
    // Draw a placeholder if sprite fails to load
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(x, y, 200, 200);
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Sprite', x + 100, y + 100);
    ctx.fillText('Not Found', x + 100, y + 120);
  }
}
