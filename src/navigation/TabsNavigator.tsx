import { BottomTabScreenProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { StackScreenProps } from "@react-navigation/stack"
import React from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Icon, Text } from "../components"
import { translate } from "../i18n"
import { 
  WalletScreen, 
  ReceiveOptionsScreen,
  ReceiveScreen,
  SendOptionsScreen, 
  SendScreen, 
  ScanScreen,
  LightningPayScreen,
  ContactsScreen,
  PictureScreen,
  ContactDetailScreen, 
  ProfileScreen,
  WalletNameScreen, 
  SettingsScreen, 
  MintsScreen,
  MintInfoScreen, 
  DeveloperScreen,
  SecurityScreen,
  PrivacyScreen,
  UpdateScreen,
  BackupScreen,
  RemoteBackupScreen,
  LocalRecoveryScreen,
  RelaysScreen,
  TranDetailScreen, 
  TranHistoryScreen,
  PaymentRequestsScreen,
  TransferScreen,
  TopupScreen,
  OwnKeysScreen,
  ReceiveOption,
  SendOption,
  TokenReceiveScreen,
} from "../screens"
import { Contact } from "../models/Contact"
import { colors, useThemeColor, spacing, typography } from "../theme"
import { AppStackParamList, AppStackScreenProps } from "./AppNavigator"
import { PaymentRequest } from "../models/PaymentRequest"
import { LNURLPayParams, LNURLWithdrawParams } from "js-lnurl"
import { MintUnit } from "../services/wallet/currency"


export type TabsParamList = {
    WalletNavigator: NavigatorScreenParams<WalletStackParamList>
    TransactionsNavigator: NavigatorScreenParams<TransactionsStackParamList>  
    ContactsNavigator: NavigatorScreenParams<ContactsStackParamList>    
    SettingsNavigator: NavigatorScreenParams<SettingsStackParamList>
}

/**
 * Helper for automatically generating navigation prop types for each route.
 *
 * More info: https://reactnavigation.org/docs/typescript/#organizing-types
 */
export type TabScreenProps<T extends keyof TabsParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabsParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

const Tab = createBottomTabNavigator<TabsParamList>()

export function TabsNavigator() {
  const { bottom } = useSafeAreaInsets()
  const bgColor = useThemeColor('menu')
  const textColor = useThemeColor('text')
  const activeColor = useThemeColor('tint')

  return (
    <Tab.Navigator
      initialRouteName="WalletNavigator"
      screenOptions={{
        headerShown: false, // managed with hook + custom component
        tabBarHideOnKeyboard: true,
        tabBarStyle: [$tabBar, { height: bottom + 70, backgroundColor: bgColor }],
        tabBarActiveTintColor: activeColor as string,
        tabBarInactiveTintColor: textColor as string,
        tabBarLabelStyle: [$tabBarLabel, {color: textColor}],
        tabBarItemStyle: $tabBarItem,        
      }}      
    >
      <Tab.Screen        
        name="WalletNavigator"
        component={WalletNavigator}
        options={{
          tabBarLabel: translate("tabNavigator.walletLabel"),
          tabBarIcon: ({ focused }) => <Icon icon="faWallet" color={focused ? activeColor : textColor} size={spacing.large} />          
        }}
      />

      <Tab.Screen        
        name="TransactionsNavigator"
        component={TransactionsNavigator}
        options={{
          tabBarLabel: "Transactions",
          tabBarIcon: ({ focused }) => <Icon icon="faListUl" color={focused ? activeColor : textColor} size={spacing.large} />,      
        }}
      />

      <Tab.Screen
        name="ContactsNavigator"
        component={ContactsNavigator}
        options={{
          tabBarLabel: translate("tabNavigator.contactsLabel"),
          tabBarIcon: ({ focused }) => <Icon icon="faAddressBook" color={focused ? activeColor : textColor} size={spacing.large} />,        
        }}
      />

      <Tab.Screen
        name="SettingsNavigator"
        component={SettingsNavigator}
        options={{
          tabBarLabel: translate("tabNavigator.settingsLabel"),
          tabBarIcon: ({ focused }) => <Icon icon="faGears" color={focused ? activeColor : textColor} size={spacing.large} />,           
        }}
      />
    </Tab.Navigator>
  )
}


export type WalletStackParamList = {  
    Wallet: {scannedMintUrl? : string}
    ReceiveOptions: {unit: MintUnit} // to be removed
    TokenReceive: {
      unit: MintUnit    
      mintUrl?: string,      
    }    
    Receive: {unit: MintUnit, encodedToken? : string}
    SendOptions: {unit: MintUnit}
    Send: {
      unit: MintUnit,
      paymentOption?: SendOption,
      contact?: Contact,
      mintUrl?: string,      
    }
    Scan: undefined
    LightningPay: {
      unit: MintUnit    
      mintUrl?: string,      
    }    
    PaymentRequests: undefined 
    Transfer: {
      unit: MintUnit,
      encodedInvoice?: string,
      paymentRequest?: PaymentRequest, 
      lnurlParams?: LNURLPayParams & {address?: string}, 
      paymentOption?: SendOption,
      mintUrl?: string,      
    }
    Topup: {      
      unit: MintUnit,
      paymentOption?: ReceiveOption,
      contact?: Contact,
      lnurlParams?: LNURLWithdrawParams,
      mintUrl?: string,      
    }
    // TranDetail: {id: number}
    ContactsNavigator: {screen: string, params: any, initial?: boolean}
    SettingsNavigator: {screen: string, params: any, initial?: boolean}
    TransactionsNavigator: {screen: string, params: any, initial?: boolean}
}

export type WalletStackScreenProps<T extends keyof WalletStackParamList> = StackScreenProps<
    WalletStackParamList,
    T
>

const WalletStack = createNativeStackNavigator<WalletStackParamList>()

const WalletNavigator = function WalletNavigator() {  

  return (
    <WalletStack.Navigator    
        screenOptions={{ 
                // presentation: '', // prevents white glitch on scren change in dark mode
                headerShown: false,        
        }}
    >        
        <WalletStack.Screen name="Wallet" component={WalletScreen} />
        <WalletStack.Screen name="ReceiveOptions" component={ReceiveOptionsScreen} />
        <WalletStack.Screen name="TokenReceive" component={TokenReceiveScreen} />
        <WalletStack.Screen name="Receive" component={ReceiveScreen} />
        <WalletStack.Screen name="SendOptions" component={SendOptionsScreen} />
        <WalletStack.Screen name="Send" component={SendScreen} />
        <WalletStack.Screen name="Scan" component={ScanScreen} />
        <WalletStack.Screen name="LightningPay" component={LightningPayScreen} />        
        <WalletStack.Screen name="PaymentRequests" component={PaymentRequestsScreen} />
        <WalletStack.Screen name="Transfer" component={TransferScreen} />
        <WalletStack.Screen name="Topup" component={TopupScreen} />
    </WalletStack.Navigator>
  )
}


export type TransactionsStackParamList = {    
  TranDetail: {id: number}
  TranHistory: undefined
  WalletNavigator: {screen: string, params: any}
  ContactsNavigator: {screen: string, params: any}
  SettingsNavigator: {screen: string, params: any}
}

export type TransactionsStackScreenProps<T extends keyof TransactionsStackParamList> = StackScreenProps<
  TransactionsStackParamList,
  T
>

const TransactionsStack = createNativeStackNavigator<TransactionsStackParamList>()

const TransactionsNavigator = function TransactionsNavigator() {  

return (
  <TransactionsStack.Navigator    
      screenOptions={{ 
              // presentation: 'transparentModal', // prevents white glitch on scren change in dark mode
              headerShown: false,        
      }}
  >   
      <TransactionsStack.Screen name="TranHistory" component={TranHistoryScreen} />
      <TransactionsStack.Screen name="TranDetail" component={TranDetailScreen}/>            
  </TransactionsStack.Navigator>
)
}


export type ContactsStackParamList = {  
    Contacts: {paymentOption?: ReceiveOption | SendOption}
    Profile: undefined
    Picture: undefined
    WalletName: undefined
    RandomName: {navigation: any}
    OwnName: {navigation: any}
    ContactDetail: {contact: Contact}
    OwnKeys: undefined
    WalletNavigator: {screen: string, params: any}
    SettingsNavigator: {screen: string}    
}  
  
export type ContactsStackScreenProps<T extends keyof ContactsStackParamList> = StackScreenProps<
    ContactsStackParamList,
    T
>
  
  const ContactsStack = createNativeStackNavigator<ContactsStackParamList>()
  
  const ContactsNavigator = function ContactsNavigator() { 
    return (
      <ContactsStack.Navigator    
        screenOptions={{ 
          // presentation: 'transparentModal', // prevents white glitch on scren change in dark mode
          headerShown: false,        
        }}
      >        
        <ContactsStack.Screen name="Contacts" component={ContactsScreen} />
        <ContactsStack.Screen name="Profile" component={ProfileScreen} />
        <ContactsStack.Screen name="Picture" component={PictureScreen} />
        <ContactsStack.Screen name="ContactDetail" component={ContactDetailScreen} />
        <ContactsStack.Screen name="OwnKeys" component={OwnKeysScreen} />
        <ContactsStack.Screen name="WalletName" component={WalletNameScreen} />        
      </ContactsStack.Navigator>
    )
  }
 

export type SettingsStackParamList = {  
  Settings: undefined
  Mints: {scannedMintUrl? : string}
  MintInfo: {mintUrl : string}
  Security: undefined
  Privacy: undefined
  Update: {
    isUpdateAvailable : boolean, 
    isNativeUpdateAvailable: boolean, 
    updateDescription: string,
    updateSize: string,
  }
  Backup: undefined
  RemoteBackup: undefined
  LocalRecovery: undefined
  Developer: undefined
  Relays: undefined
  WalletNavigator: {screen: string} 
  ContactsNavigator: {screen: string}  
}

export type SettingsStackScreenProps<T extends keyof SettingsStackParamList> = StackScreenProps<
  SettingsStackParamList,
  T
>

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>()

const SettingsNavigator = function SettingsNavigator() {  

  return (
    <SettingsStack.Navigator    
      screenOptions={{ 
        // presentation: 'transparentModal', // prevents white glitch on scren change in dark mode
        headerShown: false,        
      }}
    >        
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen name="Mints" component={MintsScreen} />
      <SettingsStack.Screen name="MintInfo" component={MintInfoScreen} />
      <SettingsStack.Screen name="Security" component={SecurityScreen} />
      <SettingsStack.Screen name="Privacy" component={PrivacyScreen} />
      <SettingsStack.Screen name="Update" component={UpdateScreen} />
      <SettingsStack.Screen name="Backup" component={BackupScreen} />
      <SettingsStack.Screen name="RemoteBackup" component={RemoteBackupScreen} />
      <SettingsStack.Screen name="LocalRecovery" component={LocalRecoveryScreen} />
      <SettingsStack.Screen name="Developer" component={DeveloperScreen} />
      <SettingsStack.Screen name="Relays" component={RelaysScreen} />
    </SettingsStack.Navigator>
  )
}

const $tabBar: ViewStyle = {  
  borderTopColor: 'transparent',
  borderTopWidth: 0,
  elevation: 0
}

const $tabBarItem: ViewStyle = {
  paddingTop: spacing.medium,
}

const $tabBarLabel: TextStyle = {
  fontSize: 12,
  fontFamily: typography.primary?.light,
  lineHeight: 16,
  flex: 1,
}
