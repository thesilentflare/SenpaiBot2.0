import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ItemAttributes {
  id: number;
  userId: string;
  itemType: number; // 1=Pokeball, 2=Greatball, 3=Ultraball, 4=Masterball
  quantity: number;
}

interface ItemCreationAttributes extends Optional<
  ItemAttributes,
  'id' | 'quantity'
> {}

export class Item
  extends Model<ItemAttributes, ItemCreationAttributes>
  implements ItemAttributes
{
  declare id: number;
  declare userId: string;
  declare itemType: number;
  declare quantity: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Item.init(
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
    itemType: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 4,
      },
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
  },
  {
    sequelize,
    tableName: 'items',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['userId', 'itemType'], unique: true },
    ],
  },
);
