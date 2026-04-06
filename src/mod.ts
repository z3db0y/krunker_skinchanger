export default class Mod {
    // v9.1.1
    readonly PLAYER_DATA_LENGTH = 50;
    readonly PACKET_SKIN_INDEXES = [
        // en, 0
        ['1'], // spray - safety check only
        ['2.0', '12.0'], // primary
        ['2.1', '12.1'], // secondary
        ['3', '13'], // hat
        ['4', '14'], // body
        ['9', '19'], // melee
        ['14', '24'], // dye
        ['15', '29'], // shoe
        ['16', '30'], // waist
        ['20', '33'], // face
        ['21', '34'], // pet
        ['25', '36'], // wrist
        ['29.0', '39.0'], // charm (primary)
        ['29.1', '39.1'], // charm (secondary)
        ['30', '41'], // back
        ['31', '42'], // head
        ['32'], // player card - safety check only
    ];

    skins: any[] = [];

    savedSkinIndexes: { [k: string]: number; } = {};
    ownedSkinIDs: any[] = [];

    username = '';

    setterFunc(obj: any, key: string, value?: any) {
        let split = key.split('.');
        for (let i = 0; i < split.length - 1; i++) {
            obj = obj[split[i]];
        }

        if (value) obj[split[split.length - 1]] = value;

        return obj[split[split.length - 1]];
    }

    onSkinsLoaded(skins: any[]) {
        this.skins = skins;
    }

    onMessage(packet: any) {
        let isUpdateAccount = packet?.[0] === 'ua';

        if (packet?.[0] === 'a' || isUpdateAccount) {
            if (!isUpdateAccount) this.username = packet[3];

            if (packet[isUpdateAccount ? 1 : 4]?.[10]) {
                this.ownedSkinIDs = packet[isUpdateAccount ? 1 : 4][10].map((x: any) => x.ind);

                packet[isUpdateAccount ? 1 : 4][10] = Array.from(
                    { length: this.skins.length },
                    (_, i) => ({ ind: i, cnt: 1, a: '' })
                );
            }
        }

        if (packet?.[0] === '0' && packet?.[1]) {
            let allPlayers = packet[1];

            if (allPlayers.length % this.PLAYER_DATA_LENGTH !== 0) return packet;

            for (let i = 0; i < allPlayers.length; i += this.PLAYER_DATA_LENGTH) {
                let playerChunk = allPlayers.slice(i, i + this.PLAYER_DATA_LENGTH);

                if (playerChunk[5] !== this.username) continue; // not self

                for (let k in this.savedSkinIndexes) {
                    let mapping =
                        this.PACKET_SKIN_INDEXES.find((x) => x[0] === k)?.[1] || '';
                    let id = this.savedSkinIndexes[k];

                    if (mapping) this.setterFunc(playerChunk, mapping, id);
                }

                allPlayers.splice(i, this.PLAYER_DATA_LENGTH, ...playerChunk); // replace
            }
        }

        return packet;
    }

    onSend(packet: any) {
        if (packet?.[0] === 'en' && packet[1]) {
            for (let i = 0; i < this.PACKET_SKIN_INDEXES.length; i++) {
                let id = this.setterFunc(packet[1], this.PACKET_SKIN_INDEXES[i][0]);

                this.savedSkinIndexes[this.PACKET_SKIN_INDEXES[i][0]] = id ?? -1;
                this.setterFunc(
                    packet[1],
                    this.PACKET_SKIN_INDEXES[i][0],
                    this.ownedSkinIDs.includes(id) ? id : -1
                );
            }
        }

        return packet;
    }
}
