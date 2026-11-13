import { Injectable } from '@nestjs/common';
import { IEventStore } from './event-store.interface';
import { IEvent } from '../events/base.event';

@Injectable()
export class InMemoryEventStore implements IEventStore {
  private events: Map<string, IEvent[]> = new Map();
  private allEvents: IEvent[] = [];

  async saveEvents(
    aggregateId: string,
    events: IEvent[],
    expectedVersion: number,
  ): Promise<void> {
    const existingEvents = this.events.get(aggregateId) ?? [];

    // Optimistic concurrency control: reject stale writes.
    if (existingEvents.length > 0) {
      const lastEvent = existingEvents[existingEvents.length - 1];
      if (lastEvent.version !== expectedVersion) {
        throw new Error('Concurrency conflict detected');
      }
    }

    // Assign sequential versions to the new events.
    let currentVersion = expectedVersion;
    const versionedEvents = events.map((event) => {
      currentVersion++;
      return { ...event, version: currentVersion };
    });

    this.events.set(aggregateId, [...existingEvents, ...versionedEvents]);
    this.allEvents.push(...versionedEvents);
  }

  async getEvents(aggregateId: string): Promise<IEvent[]> {
    return this.events.get(aggregateId) ?? [];
  }

  async getAllEvents(): Promise<IEvent[]> {
    return [...this.allEvents];
  }
}
