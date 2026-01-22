import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

interface RankAttributes {
  id: number;
  rank: string;
  expRequired: number;
}

export class Rank extends Model<RankAttributes> implements RankAttributes {
  declare id: number;
  declare rank: string;
  declare expRequired: number;
}

Rank.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    rank: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expRequired: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'ranks',
    timestamps: false,
  },
);
