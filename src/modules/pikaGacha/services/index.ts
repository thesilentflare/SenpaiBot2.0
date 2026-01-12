export { UserService } from './UserService';
export { PokemonService } from './PokemonService';
export { InventoryService } from './InventoryService';
export { GachaService } from './GachaService';
export { JackpotService } from './JackpotService';
export { TrainerService } from './TrainerService';
export { ItemService } from './ItemService';
export { TradeService } from './TradeService';
export { BattleService } from './BattleService';

import userService from './UserService';
import pokemonService from './PokemonService';
import inventoryService from './InventoryService';
import gachaService from './GachaService';
import jackpotService from './JackpotService';
import trainerService from './TrainerService';
import itemService from './ItemService';
import tradeService from './TradeService';
import battleService from './BattleService';

export default {
  user: userService,
  pokemon: pokemonService,
  inventory: inventoryService,
  gacha: gachaService,
  jackpot: jackpotService,
  trainer: trainerService,
  item: itemService,
  trade: tradeService,
  battle: battleService,
};
