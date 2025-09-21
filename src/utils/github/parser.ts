import { WebhookPayload, WebhookPayloadPushCommit } from "./types";

//Check types
export function isCommitPusshedWebhook(payload: WebhookPayload) {
  try {
    if (!payload.action) {
      if (payload.ref && payload.before && payload.after) {
        if (payload.repository.id) {
          if (payload.pusher.name) {
            return true;
          }
        }
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

export function getBranch(payload: WebhookPayloadPushCommit) {
  const refSplit = payload.ref.split("/");
  return refSplit[refSplit.length - 1];
}
