import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface TrainerAttributes {
  userId: string;
  name: string;
  rank: string;
  team: string;
  totalExp: number;
  rankExp: number;
  prestige: number;
  // Stats
  rolls: number;
  bricks: number;
  jackpots: number;
  opens: number;
  releases: number;
  trades: number;
  quizAnswered: number;
  hotStreaks: number;
  shutdowns: number;
  highestStreak: number;
  battles: number;
  wins: number;
  losses: number;
  underdogWins: number;
  highStakeWins: number;
  neverLuckyLosses: number;
  highStakeLosses: number;
}

interface TrainerCreationAttributes extends Optional<
  TrainerAttributes,
  | 'rank'
  | 'team'
  | 'totalExp'
  | 'rankExp'
  | 'prestige'
  | 'rolls'
  | 'bricks'
  | 'jackpots'
  | 'opens'
  | 'releases'
  | 'trades'
  | 'quizAnswered'
  | 'hotStreaks'
  | 'shutdowns'
  | 'highestStreak'
  | 'battles'
  | 'wins'
  | 'losses'
  | 'underdogWins'
  | 'highStakeWins'
  | 'neverLuckyLosses'
  | 'highStakeLosses'
> {}

export class Trainer
  extends Model<TrainerAttributes, TrainerCreationAttributes>
  implements TrainerAttributes
{
  declare userId: string;
  declare name: string;
  declare rank: string;
  declare team: string;
  declare totalExp: number;
  declare rankExp: number;
  declare prestige: number;
  declare rolls: number;
  declare bricks: number;
  declare jackpots: number;
  declare opens: number;
  declare releases: number;
  declare trades: number;
  declare quizAnswered: number;
  declare hotStreaks: number;
  declare shutdowns: number;
  declare highestStreak: number;
  declare battles: number;
  declare wins: number;
  declare losses: number;
  declare underdogWins: number;
  declare highStakeWins: number;
  declare neverLuckyLosses: number;
  declare highStakeLosses: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Trainer.init(
  {
    userId: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [4, 20],
        isAlphanumeric: true,
      },
    },
    rank: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
    },
    team: {
      type: DataTypes.STRING,
      defaultValue: '',
      allowNull: false,
    },
    totalExp: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    rankExp: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    prestige: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    rolls: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    bricks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    jackpots: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    opens: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    releases: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    trades: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    quizAnswered: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    hotStreaks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    shutdowns: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    highestStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    battles: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    wins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    losses: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    underdogWins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    highStakeWins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    neverLuckyLosses: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    highStakeLosses: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'trainers',
    timestamps: true,
    indexes: [{ fields: ['name'], unique: true }, { fields: ['team'] }],
  },
);
