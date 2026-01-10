### SenpaiBot2.0 v0.3 requirements proposal

Abstract: We have been using discord.py for v0.1 and v0.2, but it has been increasingly difficult to maintain and use. We would like to transition to using an alternative library such as discord.js, whilst maintaining some current features and creating new ones later on.

#### Feature reqs for initial launch (migration of some current)

- Birthday reminder feature (monthly and on days of birthdays)
- Senpai8ball
- Fortune

#### Backend

- For simplicity, still use sqlite, but should modify the following:
- Should have 2 tables to start with
  - Users
    - First name
    - Last name
    - Nickname
    - discord ID (PK)
  - Birthdays
    - discord ID (FK)
    - dateISOString

#### Phase 2 migration (migrate remaining)

- Lookups for yugioh and warframe
- Imageboard
