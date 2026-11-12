export class UpdateGuestCommand {
  constructor(
    public readonly guestId: string,
    public readonly name?: string,
    public readonly role?: string,
    public readonly isActive?: boolean,
  ) {}
}
