export class GuestCreatedEvent {
  constructor(
    public readonly guestId: string,
    public readonly email: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
