export class GuestDeletedEvent {
  constructor(
    public readonly guestId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
