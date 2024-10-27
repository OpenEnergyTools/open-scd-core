import { convertEdit, EditV2, isEditV2 } from '@openenergytools/xml-lib';

import { Edit, EditEvent, newEditEventV1 } from './edit-event-v1.js';
import {
  EditEventOptions,
  EditEventV2,
  newEditEventV2,
} from './edit-event-v2.js';

export function newEditEvent(
  edit: Edit | EditV2,
  options?: EditEventOptions
): EditEvent | EditEventV2 {
  if (isEditV2(edit)) return newEditEventV2(edit, options);
  if (options) return newEditEventV2(convertEdit(edit), options);
  return newEditEventV1(edit);
}
