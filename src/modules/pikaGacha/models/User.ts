import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface UserAttributes {
  id: string; // Discord user ID
  points: number;
  savings: number;
  three: number; // Pity rates
  four: number;
  five: number;
  focus: number;
}

interface UserCreationAttributes extends Optional<
  UserAttributes,
  'points' | 'savings' | 'three' | 'four' | 'five' | 'focus'
> {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: string;
  declare points: number;
  declare savings: number;
  declare three: number;
  declare four: number;
  declare five: number;
  declare focus: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    savings: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    three: {
      type: DataTypes.INTEGER,
      defaultValue: 540,
      allowNull: false,
    },
    four: {
      type: DataTypes.INTEGER,
      defaultValue: 420,
      allowNull: false,
    },
    five: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      allowNull: false,
    },
    focus: {
      type: DataTypes.INTEGER,
      defaultValue: 10,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
  },
);
