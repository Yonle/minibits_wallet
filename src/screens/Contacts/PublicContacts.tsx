import {observer} from 'mobx-react-lite'
import React, {useEffect, useRef, useState} from 'react'
import {FlatList, Image, TextInput, TextStyle, View, ViewStyle} from 'react-native'
import {verticalScale} from '@gocodingnow/rn-size-matters'
import Clipboard from '@react-native-clipboard/clipboard'
import {colors, spacing, typography, useThemeColor} from '../../theme'
import {BottomModal, Button, Card, ErrorModal, Icon, InfoModal, ListItem, Loading, Screen, Text} from '../../components'
import {useStores} from '../../models'
import {NostrClient, NostrEvent, NostrFilter, NostrProfile} from '../../services'
import AppError, { Err } from '../../utils/AppError'
import { log } from '../../utils/logger'
import { Contact, ContactType } from '../../models/Contact'
import { StackNavigationProp } from '@react-navigation/stack'
import { ContactsStackParamList } from '../../navigation'


const defaultPublicNpub = 'npub14n7frsyufzqsxlvkx8vje22cjah3pcwnnyqncxkuj2243jvt9kmqsdgs52'
const maxContactsToLoad = 20

export const PublicContacts = observer(function (props: {    
    navigation: StackNavigationProp<ContactsStackParamList, "Contacts", undefined>, 
    amountToSend: string | undefined}
) { 
    const {contactsStore} = useStores()
    const {navigation} = props
    const {publicRelay: ownRelay} = contactsStore
    const npubInputRef = useRef<TextInput>(null)    
    const relayInputRef = useRef<TextInput>(null)
    const currentRelays = useRef<string[]>(ownRelay ? [ownRelay] : NostrClient.getDefaultRelays())
    
    const [info, setInfo] = useState('')
    const [newPublicPubkey, setNewPublicPubkey] = useState<string>('')
    const [newPublicRelay, setNewPublicRelay] = useState<string>('')    
    
    const [ownProfile, setOwnProfile] = useState<NostrProfile | undefined>(undefined)    
    const [followingPubkeys, setFollowingPubkeys] = useState<string[]>([])
    const [followingProfiles, setFollowingProfiles] = useState<NostrProfile[]>([]) 
    
    const [isLoading, setIsLoading] = useState(false)        
    const [isNpubModalVisible, setIsNpubModalVisible] = useState(false)
    const [isNpubActionsModalVisible, setIsNpubActionsModalVisible] = useState(false)
    const [isRelayModalVisible, setIsRelayModalVisible] = useState(false)
    const [shouldReload, setShouldReload] = useState(false)
    const [error, setError] = useState<AppError | undefined>()
       
    useEffect(() => {
        const focus = () => {
            npubInputRef && npubInputRef.current
            ? npubInputRef.current.focus()
            : false
        }
  
        if (isNpubModalVisible) {
          setTimeout(() => focus(), 100)
        }
    }, [isNpubModalVisible])


    useEffect(() => {
        const focus = () => {
            relayInputRef && relayInputRef.current
            ? relayInputRef.current.focus()
            : false
        }
  
        if (isRelayModalVisible) {
          setTimeout(() => focus(), 100)
        }
    }, [isRelayModalVisible])

    // Kick-off subscriptions to relay
    useEffect(() => {
        if(!contactsStore.publicPubkey) {
            return
        }

        setOwnProfile({
            pubkey: contactsStore.publicPubkey,
            npub: NostrClient.getNpubkey(contactsStore.publicPubkey)
        }) // set backup profile w/o name

        subscribeToOwnProfileAndPubkeys()
    }, [])


    useEffect(() => {
        if(!shouldReload) {
            return
        }
        log.trace('Reloading...')        
        subscribeToOwnProfileAndPubkeys()
        setShouldReload(false)
    }, [shouldReload])


    const subscribeToOwnProfileAndPubkeys = function () {
        if(!contactsStore.publicPubkey) {
            return
        }
        
        const filter: NostrFilter[] = [{
            authors: [contactsStore.publicPubkey],
            kinds: [0, 3],
            // since: 0,
        }]        
        
        const pool = NostrClient.getRelayPool()

        log.trace('Starting own profile and following pubkeys subscription...', { filter, relays: currentRelays.current } )

        const sub = pool.sub(currentRelays.current, filter)
        sub.on('event', (event: NostrEvent) => {
            //  log.trace('own or pubkeys event', event)
            if(ownProfile && ownProfile.name && followingPubkeys && followingPubkeys.length > 0) {
                return
            }

            if(event.kind === 0) {
                const profile: NostrProfile = JSON.parse(event.content)                
                
                profile.pubkey = contactsStore.publicPubkey as string
    
                log.trace('Updating own profile', profile)    
                setOwnProfile(profile)                
            }
            
            if(event.kind === 3) {
                const pubkeys = event.tags
                    .filter((item: [string, string]) => item[0] === "p")
                    .map((item: [string, string]) => item[1])

                log.trace('Updating followingPubkeys:', pubkeys.length)
                setFollowingPubkeys(pubkeys)                
            }
        })

        sub.on('eose', () => {
            sub.unsub()
        })

    }


    useEffect(() => {
        if(followingPubkeys.length === 0) {            
            return
        }

        const filter: NostrFilter[] = [{
            authors: followingPubkeys,
            kinds: [0],
            limit: maxContactsToLoad,            
        }]

        log.trace('Starting following profiles subscription...')
        
        const pool = NostrClient.getRelayPool()
        const sub = pool.sub(currentRelays.current, filter)

        let events: NostrEvent[] = []

        sub.on('event', (event: NostrEvent) => {
            // log.trace('Profile event', event)
            events.push(event)            
        })

        sub.on('eose', () => {
            log.trace(`Got ${events.length} profile events`)

            let following: NostrProfile[] = []
            for (const event of events) {
                try {
                    const profile: NostrProfile = JSON.parse(event.content)
    
                    profile.pubkey = event.pubkey
                    profile.npub = NostrClient.getNpubkey(event.pubkey)
    
                    following.push(profile)
                } catch(e: any) {
                    continue
                }
            }
    
            log.trace('Updating following profiles', following.length)
    
            setFollowingProfiles(following)
            sub.unsub()
        })

        
    }, [followingPubkeys])

    
    const onPastePublicPubkey = async function () {
        const key = await Clipboard.getString()
        if (!key) {
          setInfo('Copy your NPUB key first, then paste')
          return
        }  
        setNewPublicPubkey(key)        
    }


    const resetContactsState = function () {
        setFollowingProfiles([])
        setFollowingPubkeys([])        
    }


    const onSavePublicPubkey = function () {        
        try {
            if(newPublicPubkey.startsWith('npub')) {
                const hexKey = NostrClient.getHexkey(newPublicPubkey)                
                contactsStore.setPublicPubkey(hexKey)                
                resetContactsState()
                setOwnProfile({
                    pubkey: hexKey,
                    npub: newPublicPubkey
                })
                toggleNpubModal()

                setTimeout(() => setShouldReload(true), 1000)
                return
            } else {
                throw new AppError(Err.VALIDATION_ERROR, 'Invalid npub key')
            }
        } catch(e: any) {
            handleError(e)
        }
    }


    const onRemovePublicPubKey = function () {
        contactsStore.setPublicPubkey('')
        setNewPublicPubkey('')
        setOwnProfile(undefined)
        resetContactsState()        
        toggleNpubActionsModal()            
    }


    const onPastePublicRelay = async function () {
        const url = await Clipboard.getString()
        if (!url) {
          setInfo('Copy your relay URL key first, then paste')
          return
        }  
        setNewPublicRelay(url)        
    }


    const onSavePublicRelay = function () {        
        try {
            if(newPublicRelay.startsWith('wss://')) {                       
                contactsStore.setPublicRelay(newPublicRelay)
                currentRelays.current = [newPublicRelay]
                setOwnProfile({
                    pubkey: contactsStore.publicPubkey as string,
                    npub: NostrClient.getNpubkey(contactsStore.publicPubkey as string)
                })
                resetContactsState()
                toggleRelayModal()
                
                setTimeout(() => setShouldReload(true), 1000)
                return
            } else {
                throw new AppError(Err.VALIDATION_ERROR, 'Invalid relay URL')
            }
        } catch(e: any) {
            handleError(e)
        }
    }


    const onRemovePublicRelay = function () {
        contactsStore.setPublicRelay('')
        currentRelays.current = NostrClient.getDefaultRelays()
        setNewPublicRelay('')
        setOwnProfile({
            pubkey: contactsStore.publicPubkey as string,
            npub: NostrClient.getNpubkey(contactsStore.publicPubkey as string)
        })     
        resetContactsState()     
        toggleRelayModal()

        setTimeout(() => setShouldReload(true), 1000)
    }


    const toggleNpubModal = () => {
        setIsNpubModalVisible(previousState => !previousState)
        if(isNpubActionsModalVisible) {
            toggleNpubActionsModal()
        }
    }


    const toggleNpubActionsModal = () => {
        setIsNpubActionsModalVisible(previousState => !previousState)
    }


    const toggleRelayModal = () => {
        setIsRelayModalVisible(previousState => !previousState)
        if(isNpubActionsModalVisible) {
            toggleNpubActionsModal()
        }
    }


    const gotoContactDetail = function (contact: Contact) {
        const {amountToSend} = props
        contact.type = ContactType.PUBLIC        
        
        if(amountToSend) {
            navigation.navigate('WalletNavigator', { 
                screen: 'Send',
                params: {
                    amountToSend, 
                    contact, 
                    relays: NostrClient.getMinibitsRelays()
                },
            })

            return
        }

        navigation.navigate('ContactDetail', {
            contact, 
            relays: currentRelays.current
        })
    }

    const handleError = function (e: AppError): void {
        setIsLoading(false)
        setError(e)
    }
    

    const inputBg = useThemeColor('background')

    return (
    <Screen contentContainerStyle={$screen}>
        <View style={$contentContainer}>
        {!contactsStore.publicPubkey && (
            <Card
                ContentComponent={
                    <ListItem
                        leftIcon='faComment'
                        leftIconInverse={true}
                        leftIconColor={colors.palette.iconViolet200}
                        text='Tip the people you follow'
                        subText={'Add your NOSTR social network public key (npub) and tip or donate to your favourite people and projects directly from the minibits wallet.'}
                        onPress={toggleNpubModal}
                    />                
                }
                style={$card}                
            />                   
        )}
        {ownProfile && (            
            <Card
                ContentComponent={
                    <ListItem                        
                        LeftComponent={
                            <View style={{marginRight: spacing.medium, borderRadius: 20, overflow: 'hidden'}}>
                                {ownProfile.picture ? (
                                    <Image 
                                        source={{uri: ownProfile.picture}}
                                        style={{width: 40, height: 40}}
                                    />
                                ) : (
                                    <Icon icon='faCircleUser' size={35} color={inputBg} />
                                )}
                            </View>
                        }
                        text={ownProfile.name}
                        subText={currentRelays.current.toString()}
                        onPress={toggleNpubActionsModal}
                        rightIcon={'faEllipsisVertical'}                                                        
                    />
                }
                style={$card}           
            />            
        )}
        {followingProfiles.length > 0 && (                           
            <Card
                ContentComponent={
                <>
                    <FlatList<NostrProfile>
                        data={followingProfiles}
                        renderItem={({ item, index }) => {
                            const isFirst= index === 0
                            return(
                                <ListItem 
                                    key={item.picture}
                                    LeftComponent={
                                        <View style={{marginRight: spacing.medium, borderRadius: 20, overflow: 'hidden'}}>
                                            {item.picture ? (
                                                <Image 
                                                    source={{uri: item.picture}}
                                                    style={{width: 40, height: 40}}
                                                />
                                            ) : (
                                                <Icon icon='faCircleUser' size={35} color={inputBg} />
                                            )}
                                        </View>}
                                    text={item.name}
                                    subText={item.about?.replace(/\r?\n|\r/g, ' ').slice(0, 80)+'...'}
                                    topSeparator={isFirst ? false : true}
                                    onPress={() => gotoContactDetail(item as Contact)}                                  
                                />
                            ) 
                        }}                        
                        keyExtractor={(item) => item.pubkey}
                        style={{ flexGrow: 0  }}                                            
                    />

                </>
                }
                style={$card}                
            />
        )}        
        </View>
        {isLoading && <Loading />}
        <BottomModal
          isVisible={isNpubActionsModalVisible ? true : false}
          top={spacing.screenHeight * 0.5}          
          ContentComponent={
            <>
                <ListItem
                    leftIcon='faKey'
                    text='Set your public key'
                    subText={'Add or change your NOSTR social network public key (npub).'}
                    onPress={toggleNpubModal}
                    bottomSeparator={true}
                    style={{paddingHorizontal: spacing.medium}}
                />
                <ListItem
                    leftIcon='faCircleNodes'
                    text='Set relay'
                    subText={'Add or change your own relay if your profile and follows are not hosted on the default relays.'}
                    onPress={toggleRelayModal}
                    bottomSeparator={true}
                    style={{paddingHorizontal: spacing.medium}}
                />
                <ListItem
                    leftIcon='faBan'
                    text='Remove your public key'
                    subText={'Remove your npub key and stop loading public contacts.'}
                    onPress={onRemovePublicPubKey}
                    bottomSeparator={true}
                    style={{paddingHorizontal: spacing.medium}}
                /> 
            </>
          }
          onBackButtonPress={toggleNpubActionsModal}
          onBackdropPress={toggleNpubActionsModal}
        />      
        <BottomModal
          isVisible={isNpubModalVisible ? true : false}
          top={spacing.screenHeight * 0.26}
          ContentComponent={
            <View style={$newContainer}>
                <Text text='Add your npub key' preset="subheading" />
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: spacing.small}}>
                    <TextInput
                        ref={npubInputRef}
                        onChangeText={(key) => setNewPublicPubkey(key)}
                        value={newPublicPubkey}
                        autoCapitalize='none'
                        keyboardType='default'
                        maxLength={64}
                        placeholder='npub...'
                        selectTextOnFocus={true}
                        style={[$npubInput, {backgroundColor: inputBg}]}                        
                    />
                    <Button
                        tx={'common.paste'}
                        preset='secondary'
                        style={$pasteButton}
                        onPress={onPastePublicPubkey}
                    />
                    <Button
                        tx={'common.save'}
                        style={$saveButton}
                        onPress={onSavePublicPubkey}
                    />
                </View>
                <View style={[$buttonContainer, {marginTop: spacing.medium}]}>
                    <Button preset='tertiary' onPress={() => setNewPublicPubkey(defaultPublicNpub)} text='Paste demo key'/>
                    <Button preset='tertiary' onPress={toggleNpubModal} text='Cancel'/>                    
                </View>                
            </View>
          }
          onBackButtonPress={toggleNpubModal}
          onBackdropPress={toggleNpubModal}
        />
        <BottomModal
          isVisible={isRelayModalVisible ? true : false}
          top={spacing.screenHeight * 0.26}
          ContentComponent={
            <View style={$newContainer}>
                <Text text='Set your own relay' preset="subheading" />
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: spacing.small}}>
                    <TextInput
                        ref={relayInputRef}
                        onChangeText={(url) => setNewPublicRelay(url)}
                        value={newPublicRelay}
                        autoCapitalize='none'
                        keyboardType='default'
                        maxLength={64}
                        placeholder='wss://...'
                        selectTextOnFocus={true}
                        style={[$npubInput, {backgroundColor: inputBg}]}                        
                    />
                    <Button
                        tx={'common.paste'}
                        preset='secondary'
                        style={$pasteButton}
                        onPress={onPastePublicRelay}
                    />
                    <Button
                        tx={'common.save'}
                        style={$saveButton}
                        onPress={onSavePublicRelay}
                    />
                </View>
                <View style={[$buttonContainer, {marginTop: spacing.medium}]}> 
                    {contactsStore.publicRelay && (                   
                        <Button preset='tertiary' onPress={onRemovePublicRelay} text='Reset to default'/>                    
                    )}
                    <Button preset='tertiary' onPress={toggleRelayModal} text='Cancel'/>                    
                </View>                
            </View>
          }
          onBackButtonPress={toggleRelayModal}
          onBackdropPress={toggleRelayModal}
        />  
        {info && <InfoModal message={info} />}
        {error && <ErrorModal error={error} />}
    </Screen>
    )
  })


const $screen: ViewStyle = {
    flex: 1,
}

const $headerContainer: TextStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingBottom: spacing.medium,
    // height: spacing.screenHeight * 0.18,
}

const $pasteButton: ViewStyle = {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    alignSelf: 'stretch',
    justifyContent: 'center', 
}

const $saveButton: ViewStyle = {
    borderRadius: spacing.small,
    marginLeft: spacing.small,
}

const $contentContainer: TextStyle = {
    flex: 0.85,
    padding: spacing.extraSmall,
  }

const $card: ViewStyle = {
    marginBottom: spacing.small,
    // flex: 1,  
}

const $bottomModal: ViewStyle = {
  // flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.large,
    paddingHorizontal: spacing.small,
}

const $item: ViewStyle = {
    paddingHorizontal: spacing.small,
    paddingLeft: 0,
}

const $newContainer: TextStyle = {
    padding: spacing.small,
    alignItems: 'center',
}

const $npubInput: TextStyle = {
    flex: 1,    
    borderTopLeftRadius: spacing.small,
    borderBottomLeftRadius: spacing.small,
    fontSize: 16,
    padding: spacing.small,
    alignSelf: 'stretch',
    textAlignVertical: 'top',
}


const $buttonContainer: ViewStyle = {
    flexDirection: 'row',
    alignSelf: 'center',
}
  
const $qrCodeContainer: ViewStyle = {
    backgroundColor: 'white',
    padding: spacing.small,
    margin: spacing.small,
}

const $bottomContainer: ViewStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: spacing.medium,
    alignSelf: 'stretch',
    // opacity: 0,
  }
  
  const $buttonNew: ViewStyle = {
    borderRadius: 30,    
    minWidth: verticalScale(130),    
  }  
