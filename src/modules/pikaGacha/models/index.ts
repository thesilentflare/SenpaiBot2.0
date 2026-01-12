import { User } from './User';
import { Pokemon } from './Pokemon';
import { Inventory } from './Inventory';
import { Item } from './Item';
import { Jackpot } from './Jackpot';
import { Trainer } from './Trainer';
import { Favorite } from './Favorite';

// Define relationships
User.hasMany(Inventory, { foreignKey: 'userId', as: 'inventory' });
Inventory.belongsTo(User, { foreignKey: 'userId' });

Pokemon.hasMany(Inventory, { foreignKey: 'pokemonId', as: 'collectors' });
Inventory.belongsTo(Pokemon, { foreignKey: 'pokemonId', as: 'pokemon' });

User.hasMany(Item, { foreignKey: 'userId', as: 'items' });
Item.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Jackpot, { foreignKey: 'userId', as: 'contributions' });
Jackpot.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Trainer, { foreignKey: 'userId', as: 'trainer' });
Trainer.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId' });

Pokemon.hasMany(Favorite, { foreignKey: 'pokemonId', as: 'favoritedBy' });
Favorite.belongsTo(Pokemon, { foreignKey: 'pokemonId', as: 'pokemon' });

export { User, Pokemon, Inventory, Item, Jackpot, Trainer, Favorite };
