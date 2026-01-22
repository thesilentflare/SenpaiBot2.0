import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface InventoryAttributes {
  id: number;
  userId: string;
  pokemonId: number;
}

interface InventoryCreationAttributes extends Optional<
  InventoryAttributes,
  'id'
> {}

export class Inventory
  extends Model<InventoryAttributes, InventoryCreationAttributes>
  implements InventoryAttributes
{
  declare id: number;
  declare userId: string;
  declare pokemonId: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Inventory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pokemonId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'inventory',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['pokemonId'] },
      { fields: ['userId', 'pokemonId'] },
    ],
  },
);
