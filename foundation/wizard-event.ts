interface WizardRequestBase {
  subWizard?: boolean;
}

export interface EditWizardRequest extends WizardRequestBase {
  element: Element;
}

export interface CreateWizardRequest extends WizardRequestBase {
  parent: Element;
  tagName: string;
}

export type WizardRequest = EditWizardRequest | CreateWizardRequest;

export type EditWizardEvent = CustomEvent<EditWizardRequest>;
export type CreateWizardEvent = CustomEvent<CreateWizardRequest>;
export type CloseWizardEvent = CustomEvent<WizardRequest>;

export type WizardEvent = EditWizardEvent | CreateWizardEvent;

export function isCreateRequest(
  wizard: CreateWizardRequest | EditWizardRequest
): wizard is CreateWizardRequest {
  return (wizard as CreateWizardRequest)?.parent !== undefined;
}

export function newEditWizardEvent(
  element: Element,
  subWizard?: boolean,
  eventInitDict?: CustomEventInit<Partial<EditWizardRequest>>
): EditWizardEvent {
  return new CustomEvent<EditWizardRequest>('oscd-edit-wizard-request', {
    bubbles: true,
    composed: true,
    ...eventInitDict,
    detail: { element, subWizard, ...eventInitDict?.detail },
  });
}

export function newCreateWizardEvent(
  parent: Element,
  tagName: string,
  subWizard?: boolean,
  eventInitDict?: CustomEventInit<Partial<CreateWizardRequest>>
): CreateWizardEvent {
  return new CustomEvent<CreateWizardRequest>('oscd-create-wizard-request', {
    bubbles: true,
    composed: true,
    ...eventInitDict,
    detail: {
      parent,
      tagName,
      subWizard,
      ...eventInitDict?.detail,
    },
  });
}

export function newCloseWizardEvent(
  wizard: WizardRequest,
  eventInitDict?: CustomEventInit<Partial<WizardRequest>>
): CloseWizardEvent {
  return new CustomEvent<WizardRequest>('oscd-close-wizard', {
    bubbles: true,
    composed: true,
    ...eventInitDict,
    detail: wizard,
  });
}

declare global {
  interface ElementEventMap {
    ['oscd-edit-wizard-request']: EditWizardEvent;
    ['oscd-create-wizard-request']: CreateWizardEvent;
    ['oscd-close-wizard']: WizardEvent;
  }
}
