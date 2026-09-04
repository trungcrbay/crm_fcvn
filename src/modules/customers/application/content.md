### Use cases live here. Each handler does one thing: it receives a command or query, calls domain logic, and persists or returns the result.

```
Notice what's missing: no HTTP-specific concepts, no TypeORM, no NestJS response objects. This handler works identically whether triggered via REST, a CLI command, or a message queue consumer.
```
