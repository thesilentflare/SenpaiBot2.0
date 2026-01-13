import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface FavoriteAttributes {
  id: number;
  userId: string;
  pokemonId: number;
}

interface FavoriteCreationAttributes extends Optional<
  FavoriteAttributes,
  'id'
> {}

export class Favorite
  extends Model<FavoriteAttributes, FavoriteCreationAttributes>
  implements FavoriteAttributes
{
  declare id: number;
  declare userId: string;
  declare pokemonId: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Favorite.init(
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
    tableName: 'favorites',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'pokemonId'],
        unique: true,
        name: 'favorites_user_pokemon_unique',
      },
    ],
  },
);
