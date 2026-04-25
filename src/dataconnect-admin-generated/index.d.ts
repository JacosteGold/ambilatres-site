import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface AddItemToCollectionData {
  collectionItem_insert: CollectionItem_Key;
}

export interface AddItemToCollectionVariables {
  collectionId: UUIDString;
  itemId: UUIDString;
  position: number;
}

export interface CollectionItem_Key {
  collectionId: UUIDString;
  itemId: UUIDString;
  __typename?: 'CollectionItem_Key';
}

export interface Collection_Key {
  id: UUIDString;
  __typename?: 'Collection_Key';
}

export interface Comment_Key {
  id: UUIDString;
  __typename?: 'Comment_Key';
}

export interface CreateNewItemData {
  item_insert: Item_Key;
}

export interface CreateNewItemVariables {
  title: string;
  description: string;
  isPublic: boolean;
  category?: string | null;
  imageUrl?: string | null;
}

export interface GetMyCollectionsData {
  collections: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    isPublic: boolean;
    createdAt: TimestampString;
    collectionItems_on_collection: ({
      position: number;
      item: {
        id: UUIDString;
        title: string;
        imageUrl?: string | null;
      } & Item_Key;
    })[];
  } & Collection_Key)[];
}

export interface GetPublicItemsData {
  items: ({
    id: UUIDString;
    title: string;
    description: string;
    imageUrl?: string | null;
    category?: string | null;
    user?: {
      id: UUIDString;
      username: string;
      displayName?: string | null;
      profilePictureUrl?: string | null;
    } & User_Key;
      createdAt: TimestampString;
  } & Item_Key)[];
}

export interface Item_Key {
  id: UUIDString;
  __typename?: 'Item_Key';
}

export interface Like_Key {
  userId: UUIDString;
  itemId: UUIDString;
  __typename?: 'Like_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'GetPublicItems' Query. Allow users to execute without passing in DataConnect. */
export function getPublicItems(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetPublicItemsData>>;
/** Generated Node Admin SDK operation action function for the 'GetPublicItems' Query. Allow users to pass in custom DataConnect instances. */
export function getPublicItems(options?: OperationOptions): Promise<ExecuteOperationResponse<GetPublicItemsData>>;

/** Generated Node Admin SDK operation action function for the 'GetMyCollections' Query. Allow users to execute without passing in DataConnect. */
export function getMyCollections(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyCollectionsData>>;
/** Generated Node Admin SDK operation action function for the 'GetMyCollections' Query. Allow users to pass in custom DataConnect instances. */
export function getMyCollections(options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyCollectionsData>>;

/** Generated Node Admin SDK operation action function for the 'CreateNewItem' Mutation. Allow users to execute without passing in DataConnect. */
export function createNewItem(dc: DataConnect, vars: CreateNewItemVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewItemData>>;
/** Generated Node Admin SDK operation action function for the 'CreateNewItem' Mutation. Allow users to pass in custom DataConnect instances. */
export function createNewItem(vars: CreateNewItemVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewItemData>>;

/** Generated Node Admin SDK operation action function for the 'AddItemToCollection' Mutation. Allow users to execute without passing in DataConnect. */
export function addItemToCollection(dc: DataConnect, vars: AddItemToCollectionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AddItemToCollectionData>>;
/** Generated Node Admin SDK operation action function for the 'AddItemToCollection' Mutation. Allow users to pass in custom DataConnect instances. */
export function addItemToCollection(vars: AddItemToCollectionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<AddItemToCollectionData>>;

