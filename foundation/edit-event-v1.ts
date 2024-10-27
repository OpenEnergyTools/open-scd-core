/** Intent to `parent.insertBefore(node, reference)` */
import { Insert, Remove } from '@openenergytools/xml-lib';

/** @deprecated */
export type NamespacedAttributeValue = {
  value: string | null;
  namespaceURI: string | null;
};
/** @deprecated */
export type AttributeValue = string | null | NamespacedAttributeValue;

/** Intent to set or remove (if null) attributes on element @deprecated */
export type Update = {
  element: Element;
  attributes: Partial<Record<string, AttributeValue>>;
};

/** Represents the user's intent to change an XMLDocument @deprecated */
export type Edit = Insert | Update | Remove | Edit[];

export function isNamespaced(
  value: AttributeValue
): value is NamespacedAttributeValue {
  return value !== null && typeof value !== 'string';
}

export function isUpdate(edit: Edit): edit is Update {
  return (edit as Update).element !== undefined;
}

/** @deprecated */
export type EditEvent<E extends Edit = Edit> = CustomEvent<E>;

/**
 * @deprecated
 * @param edit
 * @returns a custom event `oscd-edit`
 */
export function newEditEventV1<E extends Edit>(edit: E): EditEvent<E> {
  return new CustomEvent<E>('oscd-edit', {
    composed: true,
    bubbles: true,
    detail: edit,
  });
}

declare global {
  interface ElementEventMap {
    ['oscd-edit']: EditEvent;
  }
}
