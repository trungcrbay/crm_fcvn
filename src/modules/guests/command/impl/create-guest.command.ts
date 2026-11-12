export class CreateGuestCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
    public readonly role: string = 'guest',
  ) {}
}
