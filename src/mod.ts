export default class Mod {
    // v7.5.0
    readonly SKIN_FILES = 2;
    readonly PLAYER_LEN = 46;
    readonly INDEX_MAP = [
        // en, 0
        ['2.0', '12.0'], // primary
        ['2.1', '12.1'], // secondary
        ['3', '13'], // hat
        ['4', '14'], // body
        ['9', '19'], // melee
        ['14', '24'], // dye
        ['15', '29'], // shoe
        ['16', '30'], // waist
        ['30', '34'], // pet
        ['34', '36'], // wrist
        ['38.0', '39.0'], // charm (primary)
        ['38.1', '39.1'], // charm (secondary)
        ['39', '41'], // back
        ['40', '42'], // head
    ];

    skins: any[] = [];

    savedIndexes = {};
    ownedIDs: any[] = [];

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
        if (packet?.[0] === 'a') {
            this.username = packet[3];

            if (packet[4]?.[10]) {
                this.ownedIDs = packet[4][10].map((x: any) => x.ind);

                packet[4][10] = Array.from(
                    { length: this.skins.length },
                    (_, i) => ({ ind: i, cnt: 1, a: '' })
                );
            }
        }

        if (packet?.[0] === '0' && packet?.[1]) {
            let allPlayers = packet[1];

            if (allPlayers.length % this.PLAYER_LEN !== 0) return packet;

            for (let i = 0; i < allPlayers.length; i += this.PLAYER_LEN) {
                let playerChunk = allPlayers.slice(i, i + this.PLAYER_LEN);

                if (playerChunk[5] !== this.username) continue; // not self

                for (let k in this.savedIndexes) {
                    let mapping =
                        this.INDEX_MAP.find((x) => x[0] === k)?.[1] || '';
                    let id = this.savedIndexes[k];

                    if (mapping) this.setterFunc(playerChunk, mapping, id);
                }

                allPlayers.splice(i, this.PLAYER_LEN, ...playerChunk); // replace
            }

            console.log('packet', packet);
        }

        return packet;
    }

    onSend(packet: any) {
        if (packet?.[0] === 'en' && packet[1]) {
            for (let i = 0; i < this.INDEX_MAP.length; i++) {
                let id = this.setterFunc(packet[1], this.INDEX_MAP[i][0]);

                this.savedIndexes[this.INDEX_MAP[i][0]] = id ?? -1;
                this.setterFunc(
                    packet[1],
                    this.INDEX_MAP[i][0],
                    this.ownedIDs.includes(id) ? id : -1
                );
            }
        }

        return packet;
    }
}
