# WPP API 速查（从运行中的实例枚举）

wa-js 版本：**4.6.0**　来源：WhatsApp Web 页面里 `window.WPP` 的实际成员，不是文档抄录。

重新生成：在 WhatsApp Web 页面执行

```js
const W = window.WPP, out = {};
for (const k of Object.keys(W)) {
  const v = W[k];
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const fns = Object.keys(v).filter(n => typeof v[n] === 'function');
    if (fns.length) out[k] = fns.sort();
  }
}
copy(JSON.stringify(out, null, 2));
```

## WPP.blocklist　(4)

`all` · `blockContact` · `isBlocked` · `unblockContact`

## WPP.call　(6)

`accept` · `enableCallInterface` · `end` · `offer` · `reject` · `rejectCall`

## WPP.cart　(7)

`add` · `clear` · `get` · `getThumbFromCart` · `remove` · `submit` · `update`

## WPP.catalog　(15)

`addProductImage` · `changeProductImage` · `createCollection` · `createProduct` · `delProducts` · `deleteCollection` · `editCollection` · `editProduct` · `getCollections` · `getMyCatalog` · `getProductById` · `getProducts` · `removeProductImage` · `setProductVisibility` · `updateCartEnabled`

## WPP.chat　(69)

`archive` · `canMarkPlayed` · `canMute` · `canReply` · `clear` · `closeChat` · `delete` · `deleteMessage` · `downloadMedia` · `editMessage` · `find` · `forwardMessage` · `forwardMessages` · `generateMessageID` · `get` · `getActiveChat` · `getLastSeen` · `getMessageACK` · `getMessageById` · `getMessages` · `getNotes` · `getPlatformFromMessage` · `getQuotedMsg` · `getQuotedMsgKey` · `getReactions` · `getUnreadChats` · `getVotes` · `keepMessage` · `list` · `markIsComposing` · `markIsPaused` · `markIsRead` · `markIsRecording` · `markIsUnread` · `markPlayed` · `mute` · `openChatAt` · `openChatBottom` · `openChatFromUnread` · `pin` · `pinMsg` · `prepareLinkPreview` · `prepareMessageButtons` · `prepareRawMessage` · `rehydrateMessage` · `replyToButtonMessage` · `requestPhoneNumber` · `sendCatalogMessage` · `sendChargeMessage` · `sendCreatePollMessage` · `sendEventMessage` · `sendFileMessage` · `sendGroupInviteMessage` · `sendListMessage` · `sendLocationMessage` · `sendPixKeyMessage` · `sendRawMessage` · `sendReactionToMessage` · `sendScheduledCallMessage` · `sendTextMessage` · `sendVCardContactMessage` · `setChatList` · `setInputText` · `setNotes` · `starMessage` · `unarchive` · `unmute` · `unpin` · `unpinMsg`

## WPP.community　(9)

`addSubgroups` · `create` · `deactivate` · `demoteParticipants` · `getAnnouncementGroup` · `getParticipants` · `getSubgroups` · `promoteParticipants` · `removeSubgroups`

## WPP.conn　(40)

`cancelLinkDeviceCode` · `changeEnviromentDevice` · `genLinkDeviceCodeForPhoneNumber` · `getABPropName` · `getABProps` · `getABPropsMap` · `getAuthCode` · `getAutoDownloadSettings` · `getBuildConstants` · `getHistorySyncProgress` · `getMigrationState` · `getMyDeviceId` · `getMyUserId` · `getMyUserLid` · `getMyUserWid` · `getPlatform` · `getStreamData` · `getTheme` · `isAuthenticated` · `isIdle` · `isMainInit` · `isMainLoaded` · `isMainReady` · `isMultiDevice` · `isOnline` · `isRegistered` · `isWhatsAppVersionGTE` · `joinWebBeta` · `logout` · `markAvailable` · `markUnavailable` · `needsUpdate` · `refreshLinkDeviceCode` · `refreshQR` · `setAutoDownloadSettings` · `setKeepAlive` · `setLimit` · `setMultiDevice` · `setTheme` · `startLinkDeviceCodeForPhoneNumber`

## WPP.contact　(17)

`InvalidWidForGetPnLidEntry` · `get` · `getBusinessProfile` · `getCommonGroups` · `getPnLidEntry` · `getProfilePictureUrl` · `getStatus` · `getUsername` · `list` · `queryExists` · `queryUsernameExists` · `queryWidExists` · `remove` · `reportContact` · `save` · `subscribePresence` · `unsubscribePresence`

## WPP.ev　(26)

`EventEmitter` · `addListener` · `emit` · `emitAsync` · `eventNames` · `getMaxListeners` · `hasListeners` · `listenTo` · `listenerCount` · `listeners` · `listenersAny` · `many` · `off` · `offAny` · `on` · `onAny` · `once` · `prependAny` · `prependListener` · `prependMany` · `prependOnceListener` · `removeAllListeners` · `removeListener` · `setMaxListeners` · `stopListeningTo` · `waitFor`

## WPP.group　(32)

`addParticipants` · `approve` · `canAdd` · `canDemote` · `canPromote` · `canRemove` · `create` · `demoteParticipants` · `ensureGroup` · `ensureGroupAndParticipants` · `getAllGroups` · `getGroupInfoFromInviteCode` · `getGroupSizeLimit` · `getInviteCode` · `getMembershipRequests` · `getParticipants` · `getPastParticipants` · `iAmAdmin` · `iAmMember` · `iAmRestrictedMember` · `iAmSuperAdmin` · `join` · `leave` · `promoteParticipants` · `reject` · `removeIcon` · `removeParticipants` · `revokeInviteCode` · `setDescription` · `setIcon` · `setProperty` · `setSubject`

## WPP.indexdb　(1)

`getMessagesFromRowId`

## WPP.labels　(10)

`addNewLabel` · `addOrRemoveLabels` · `colorIsInLabelPalette` · `deleteAllLabels` · `deleteLabel` · `editLabel` · `getAllLabels` · `getLabelById` · `getLabelColorPalette` · `getNewLabelColor`

## WPP.lists　(6)

`addChats` · `create` · `list` · `remove` · `removeChats` · `rename`

## WPP.loader　(14)

`__debug` · `ensureLazyModule` · `injectFallbackModule` · `injectLoader` · `isReactComponent` · `loadModule` · `moduleRequire` · `moduleSource` · `modules` · `onFullReady` · `onInjected` · `onReady` · `search` · `searchId`

## WPP.newsletter　(8)

`create` · `destroy` · `edit` · `follow` · `getSubscribers` · `mute` · `search` · `unfollow`

## WPP.order　(4)

`accept` · `decline` · `get` · `update`

## WPP.privacy　(9)

`get` · `getDisallowedList` · `setAbout` · `setAddGroup` · `setLastSeen` · `setOnline` · `setProfilePic` · `setReadReceipts` · `setStatus`

## WPP.profile　(9)

`editBusinessProfile` · `getMyProfileName` · `getMyProfilePicture` · `getMyStatus` · `isBusiness` · `removeMyProfilePicture` · `setMyProfileName` · `setMyProfilePicture` · `setMyStatus`

## WPP.status　(9)

`get` · `getMyStatus` · `remove` · `sendImageStatus` · `sendRawStatus` · `sendReadStatus` · `sendTextStatus` · `sendVideoStatus` · `updateParticipants`

## WPP.util　(17)

`WPPError` · `blobToArrayBuffer` · `blobToBase64` · `convertToFile` · `createWid` · `downloadImage` · `fetchDataFromPNG` · `generateOrderUniqueId` · `getVideoInfoFromBuffer` · `isBase64` · `isUrl` · `isUsernameKey` · `resizeImage` · `stripUsernamePrefix` · `toArrayBuffer` · `validateUsername` · `wrapFunction`

## WPP.whatsapp　(97)

`AggReactionsModel` · `AttachMediaModel` · `BaseCollection` · `BlocklistModel` · `BotProfileModel` · `BusinessCategoriesResultCollection` · `BusinessCategoriesResultModel` · `BusinessProfileModel` · `ButtonCollection` · `CallCollection` · `CallModel` · `CartItemModel` · `CartModel` · `CatalogModel` · `ChatCollection` · `ChatModel` · `ChatPreferenceModel` · `ChatstateCollection` · `ChatstateModel` · `CmdClass` · `Collection` · `ContactCollection` · `ContactModel` · `ConversionTupleModel` · `EmojiVariantModel` · `EventEmitter` · `GroupMetadataCollection` · `GroupMetadataModel` · `HistorySyncProgressModel` · `LabelItemCollection` · `LabelItemModel` · `LabelModel` · `MediaBlobCacheImpl` · `MediaDataModel` · `MediaEntry` · `MediaObject` · `Model` · `ModelChatBase` · `MsgButtonReplyMsgModel` · `MsgCollection` · `MsgInfoModel` · `MsgInfoParticipantModel` · `MsgKey` · `MsgLoad` · `MsgModel` · `MuteModel` · `NetworkStatusModel` · `NoteCollection` · `NoteModel` · `OpaqueData` · `OpaqueDataBase` · `OrderItemCollection` · `OrderItemModel` · `OrderModel` · `ParticipantCollection` · `ParticipantModel` · `PresenceModel` · `ProductCatalogSession` · `ProductCollCollection` · `ProductCollModel` · `ProductCollection` · `ProductImageCollection` · `ProductImageModel` · `ProductMessageListModel` · `ProductModel` · `ProfilePicThumbModel` · `QuickReplyModel` · `ReactionsModel` · `ReactionsSendersCollection` · `ReactionsSendersModel` · `RecentEmojiModel` · `RecentStickerModel` · `ReplyButtonModel` · `StarredMsgCollection` · `StatusModel` · `StatusV3Model` · `StickerCollection` · `StickerModel` · `StickerPackCollection` · `StickerPackModel` · `StreamModel` · `TemplateButtonCollection` · `TemplateButtonModel` · `USyncQuery` · `USyncUser` · `UnreadMentionModel` · `Wid` · `getAutoDownloadAudio` · `getAutoDownloadDocuments` · `getAutoDownloadPhotos` · `getAutoDownloadVideos` · `getTheme` · `setAutoDownloadAudio` · `setAutoDownloadDocuments` · `setAutoDownloadPhotos` · `setAutoDownloadVideos` · `setTheme`
