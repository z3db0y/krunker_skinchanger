import { encode, decode } from 'msgpackr';
import * as jsonpack from 'jsonpack';
import Mod from './mod';

export class Hook {
    init(mod: Mod) {
        const h = this;

        window.WebSocket = class Hooked extends WebSocket {
            _onmessage: null | ((this: WebSocket, ev: MessageEvent) => any);

            constructor(url: string, protocols?: string | string[]) {
                super(url, protocols);

                this.addEventListener('message', (ev) => {
                    let customEvent = {
                        isTrusted: true,
                        data: ev.data,
                    };

                    try {
                        let ab = ev.data as ArrayBuffer;
                        let packet = decode(new Uint8Array(ab.slice(0, -2)));
                        let sig = ab.slice(-2);

                        let newPack = mod.onMessage(packet);
                        let newPackEnc = new Uint8Array(encode(newPack));
                        let newAbSig = new Uint8Array(
                            newPackEnc.byteLength + 2
                        );

                        newAbSig.set(newPackEnc);
                        newAbSig.set(
                            new Uint8Array(sig),
                            newPackEnc.byteLength
                        );

                        customEvent.data = newAbSig.buffer;
                    } catch (e) {
                        console.log(e);
                    }

                    try {
                        this._onmessage?.call(this, customEvent);
                    } catch (e) {
                        console.error(e);
                    }
                });
            }

            set onmessage(
                listener: ((this: WebSocket, ev: MessageEvent) => any) | null
            ) {
                this._onmessage = listener;
            }

            send(data: any) {
                try {
                    let ab = data as ArrayBuffer;
                    let packet = decode(new Uint8Array(ab.slice(0, -2)));
                    let sig = ab.slice(-2);

                    let newPack = mod.onSend(packet);
                    let newPackEnc = new Uint8Array(encode(newPack));
                    let newAbSig = new Uint8Array(newPackEnc.byteLength + 2);

                    newAbSig.set(newPackEnc);
                    newAbSig.set(new Uint8Array(sig), newPackEnc.byteLength);

                    data = newAbSig.buffer;
                } catch (e) {
                    console.log(e);
                }

                return super.send(data);
            }
        } as any;

        let skinsChunks = {};

        window.XMLHttpRequest = class Hooked extends XMLHttpRequest {
            open(
                method: string,
                url: string,
                async: boolean = true,
                user?: string,
                password?: string
            ) {
                super.open(method, url, async, user, password);

                if (url.includes('.jspck')) {
                    this.addEventListener('load', () => {
                        let urlObj = new URL(url, location.href);
                        skinsChunks[urlObj.pathname] = this.response;

                        if (Object.keys(skinsChunks).length === mod.SKIN_FILES) {
                            try {
                                let len = 0;

                                for (let i = 0; i < mod.SKIN_FILES; i++) {
                                    len +=
                                        skinsChunks[`/skins${i}.jspck`]
                                            .byteLength;
                                }

                                let skins = new Uint8Array(len);
                                let offset = 0;

                                for (let i = 0; i < mod.SKIN_FILES; i++) {
                                    skins.set(
                                        new Uint8Array(
                                            skinsChunks[`/skins${i}.jspck`]
                                        ),
                                        offset
                                    );
                                    offset +=
                                        skinsChunks[`/skins${i}.jspck`]
                                            .byteLength;
                                }

                                let s: any = jsonpack.unpack(
                                    new TextDecoder().decode(skins)
                                );
                                mod.onSkinsLoaded(s);
                            } catch (e) {
                                console.log(e);
                            }
                        }
                    });
                }
            }
        } as any;
    }
}
