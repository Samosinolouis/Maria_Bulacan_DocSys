/** Archive folder operations. */

import { FOLDER_FIELDS } from './fields';

export const FOLDER_OPS = {
  get: `query Folder($id: ID!) { folder(id: $id) { ${FOLDER_FIELDS} } }`,
  list: `query Folders($parentId: ID) { folders(parentId: $parentId) { ${FOLDER_FIELDS} } }`,
  create: `mutation CreateFolder($input: CreateFolderInput!) {
    createFolder(input: $input) { changedEntities folder { ${FOLDER_FIELDS} } }
  }`,
};
