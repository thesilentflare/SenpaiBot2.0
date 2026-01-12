import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface JackpotAttributes {
  id: number;
  userId: string;
  contribution: number;
}

interface JackpotCreationAttributes extends Optional<
  JackpotAttributes,
  'id' | 'contribution'
> {}

export class Jackpot
  extends Model<JackpotAttributes, JackpotCreationAttributes>
  implements JackpotAttributes
{
  declare id: number;
  declare userId: string;
  declare contribution: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Jackpot.init(
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
    contribution: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
  },
  {
    sequelize,
    tableName: 'jackpot',
    timestamps: true,
    indexes: [{ fields: ['userId'], unique: true }],
  },
);
