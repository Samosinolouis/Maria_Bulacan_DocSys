/** Session bootstrap operation (`me`). Ungated. */

import { ROLE_FIELDS, USER_FIELDS } from './fields';

export const SESSION_OPS = {
  me: `
    query Me {
      me {
        ${USER_FIELDS}
        roles { ${ROLE_FIELDS} }
        effectivePermissions
      }
    }
  `,
};
