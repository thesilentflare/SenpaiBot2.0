# Logging System

SenpaiBot2.0 uses a structured logging system built on [Winston](https://github.com/winstonjs/winston) with daily log rotation. This ensures that logs are preserved between bot restarts and can be reviewed for debugging and monitoring purposes.

## Features

- **Multiple log levels**: debug, info, warn, error, critical
- **File rotation**: Logs are rotated daily to prevent files from becoming too large
- **Automatic retention**: Old logs are automatically cleaned up based on retention policy
- **Module-specific logging**: Each module has its own logger instance for better organization
- **Console + File output**: Important messages appear in console, all logs are saved to files

## Log Levels

- **debug**: Detailed information for debugging (module initialization, cleanup, etc.)
- **info**: General information about bot operation
- **warn**: Warning messages that don't stop execution
- **error**: Error conditions that should be investigated
- **critical**: Severe errors that may threaten system stability

## Configuration

Add these environment variables to your `.env` file:

```env
# Number of days to retain log files (default: 14)
LOG_RETENTION_DAYS=14

# Minimum log level to record: debug, info, warn, error, critical (default: info)
LOG_LEVEL=info
```

## Log Files

Logs are stored in the `logs/` directory with the following structure:

- `combined-YYYY-MM-DD.log` - All logs at configured level and above
- `error-YYYY-MM-DD.log` - Only error and critical logs
- `critical-YYYY-MM-DD.log` - Only critical logs (retained for 30 days)

### File Rotation

- Files are rotated daily at midnight
- Maximum file size: 20MB (will rotate early if exceeded)
- Old files are automatically deleted after the retention period

## Usage in Code

### In Module Index Files

```typescript
import Logger from '../../utils/logger';

class MyModule implements BotModule {
  private logger = Logger.forModule('myModule');

  initialize(client: Client): void {
    this.logger.debug('Module initialized');
  }

  async handleMessage(message: Message): Promise<boolean> {
    try {
      this.logger.info('Processing message', { userId: message.author.id });
      // ... process message
      return true;
    } catch (error) {
      this.logger.error('Error processing message', error);
      return false;
    }
  }

  cleanup(): void {
    this.logger.debug('Module cleaned up');
  }
}
```

### In Helper Files

```typescript
import Logger from '../../utils/logger';

const logger = Logger.forModule('myModule-helpers');

export function myHelper() {
  try {
    logger.debug('Helper function called');
    // ... helper logic
  } catch (error) {
    logger.error('Helper function failed', error);
  }
}
```

### In Main Files (index.ts, moduleLoader.ts)

```typescript
import Logger from './utils/logger';

const logger = Logger.forModule('Main');

// For startup messages that should ONLY appear in console (not in files)
Logger.console('Bot started successfully!');

// For regular logging
logger.info('Application initialized', { version: '2.0' });
logger.error('Connection failed', error);
logger.critical('Database unavailable', error);
```

## Console vs File Logging

- **Console**: Startup messages (bot online, module count, etc.) use `Logger.console()` to appear only in console
- **Files**: All other logs using `logger.debug/info/warn/error/critical()` go to both console and files

This ensures you see the important startup info when the bot launches, while detailed operational logs are preserved in files for later review.

## Best Practices

1. **Use appropriate log levels**:
   - `debug` for initialization, cleanup, and detailed operation info
   - `info` for significant events (user actions, scheduled tasks)
   - `warn` for recoverable issues
   - `error` for errors that need attention
   - `critical` for system-threatening issues

2. **Include context**: Add metadata objects to provide context
   ```typescript
   logger.info('User action', { 
     userId: user.id, 
     action: 'rename', 
     newName: 'JohnDoe' 
   });
   ```

3. **Pass Error objects**: Always pass the actual Error object, not just the message
   ```typescript
   // Good
   logger.error('Database query failed', error);
   
   // Avoid
   logger.error(`Database query failed: ${error.message}`);
   ```

4. **Module-specific loggers**: Always use `Logger.forModule('moduleName')` to create module-specific loggers for better log organization

## Monitoring Logs

### View recent logs
```bash
# View latest combined log
tail -f logs/combined-$(date +%Y-%m-%d).log

# View latest error log
tail -f logs/error-$(date +%Y-%m-%d).log

# View all logs from today
cat logs/combined-$(date +%Y-%m-%d).log
```

### Search logs
```bash
# Search for errors from a specific module
grep "userManager" logs/error-*.log

# Search for specific user activity
grep "userId.*123456" logs/combined-*.log
```

### Cleanup
Logs are automatically cleaned up based on `LOG_RETENTION_DAYS`. You can manually delete old logs:
```bash
# Remove logs older than 7 days
find logs/ -name "*.log" -mtime +7 -delete
```

## Migration from console.log

All `console.log`, `console.error`, and `console.warn` statements have been replaced with structured logging:

- `console.log()` → `logger.debug()` or `logger.info()`
- `console.error()` → `logger.error()`
- `console.warn()` → `logger.warn()`
- Startup messages → `Logger.console()`

The logger automatically includes timestamps, log levels, module names, and formats errors with stack traces.
