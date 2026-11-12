export class GuestUpdatedEvent {
  constructor(
    public readonly guestId: string,
    public readonly updatedFields: Record<string, any>,
    public readonly timestamp: Date = new Date(),
  ) {}
}
