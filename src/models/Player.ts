export interface IPlayerJSON {
  id: string;
  fullName: string;
  club?: string;
  phone?: string;
}

export class Player {
  public id: string;
  public fullName: string;
  public club: string;
  public phone: string;

  constructor(id: string, fullName: string, club: string = '', phone: string = '') {
    this.id = id || `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.fullName = fullName.trim();
    this.club = club.trim();
    this.phone = phone.trim();
  }

  public isValid(): boolean {
    return this.fullName.length > 0;
  }

  public toJSON(): IPlayerJSON {
    return {
      id: this.id,
      fullName: this.fullName,
      club: this.club,
      phone: this.phone,
    };
  }

  public static fromJSON(json: IPlayerJSON): Player {
    return new Player(json.id, json.fullName, json.club || '', json.phone || '');
  }
}
