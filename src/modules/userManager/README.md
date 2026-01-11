# User Manager Module

The User Manager module handles user registration and management functionality for the SenpaiBot.

## Features

### Automatic User Registration

When a new user joins the Discord server, they are automatically:

- Added to the Users database table
- Greeted with a welcome message in the main general channel
- Informed about setting their birthday with the `!birth` command

### Commands

#### `!user info [@user|discordID]`

Display user information from the database.

**Usage:**

- `!user info` - Show your own user information
- `!user info @username` - Show information for a mentioned user
- `!user info 123456789` - Show information for a specific Discord ID

**Permissions:** Available to all users

**Example:**

```
!user info @SenpaiBot
```

#### `!user rename @user NewName`

Rename a user in the database (admin only).

**Usage:**

- `!user rename @username NewName` - Rename a mentioned user
- `!user rename 123456789 NewName` - Rename a user by Discord ID

**Permissions:** Admin only

**Example:**

```
!user rename @OldUsername CoolNewName
```

## Database Functions

The module provides the following helper functions in `helpers.ts`:

- `addUser(discordID, name)` - Add a new user to the database
- `updateUserName(discordID, newName)` - Update a user's name
- `getUserByDiscordID(discordID)` - Retrieve user information
- `getAllUsers()` - Get all users ordered by name
- `userExists(discordID)` - Check if a user exists in the database

## Event Handlers

### guildMemberAdd

Automatically triggered when a new member joins the server. Adds the user to the database and sends a welcome message.

## Configuration

This module requires the following environment variables:

- `MAIN_GENERAL_CHANNEL_ID` - The channel ID where welcome messages are sent

## Testing

Run tests with:

```bash
npm test userManager
```
