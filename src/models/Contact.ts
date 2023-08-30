import {Instance, SnapshotIn, SnapshotOut, types} from 'mobx-state-tree'
import { MINIBITS_NIP05_DOMAIN } from '@env'

export type ContactData = {    
    [index: string]: any
}

export enum ContactType {
    PRIVATE = 'PRIVATE',
    PUBLIC = 'PUBLIC',
}

export const ContactModel = types
    .model('Contact', {        
        type: types.optional(types.frozen<ContactType>(), ContactType.PRIVATE),        
        npub: types.string,
        pubkey: types.string,
        name: types.maybe(types.string),
        about: types.maybe(types.string),
        displayName: types.maybe(types.string),     
        picture: types.maybe(types.string),
        nip05: types.maybe(types.string),
        noteToSelf: types.maybe(types.string),
        data: types.maybe(types.string),        
        createdAt: types.optional(types.number, Math.floor(Date.now() / 1000)),
    }).views(self => ({        
        get nip05handle() {
            if(!self.nip05 && self.type === ContactType.PRIVATE) {
                return self.name+MINIBITS_NIP05_DOMAIN
            }

            return self.nip05
        },
    }))

export type Contact = {
    npub: string
    pubkey: string    
    name?: string
    nip05?: string
    picture?: string
    data?: string   
    noteToSelf?: string
} & Partial<Instance<typeof ContactModel>>
export interface ContactSnapshotOut
  extends SnapshotOut<typeof ContactModel> {}
export interface ContactSnapshotIn
  extends SnapshotIn<typeof ContactModel> {}
