import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface PokemonAttributes {
  id: number;
  name: string;
  rarity: number;
  bst: number; // Base Stat Total
  focus: boolean;
  regionId: number;
  isSpecial: boolean; // For special pokemon (ID >= 10000)
  active: boolean; // For special pokemon rotation
}

interface PokemonCreationAttributes extends Optional<
  PokemonAttributes,
  'focus' | 'isSpecial' | 'active'
> {}

export class Pokemon
  extends Model<PokemonAttributes, PokemonCreationAttributes>
  implements PokemonAttributes
{
  declare id: number;
  declare name: string;
  declare rarity: number;
  declare bst: number;
  declare focus: boolean;
  declare regionId: number;
  declare isSpecial: boolean;
  declare active: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Pokemon.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rarity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 8,
      },
    },
    bst: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    focus: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    regionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isSpecial: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'pokemon',
    timestamps: false,
    indexes: [
      { fields: ['rarity'] },
      { fields: ['regionId'] },
      { fields: ['focus'] },
      { fields: ['isSpecial', 'active'] },
    ],
  },
);
