import type { StorageBroadcastMessage } from "./types";

/**
 * The name of the broadcast channel.
 */
const CHANNEL_NAME = "nanostorage:sync";

/**
 * The ID of the current tab.
 */
const TAB_ID: string =
  typeof globalThis.crypto !== "undefined" &&
  typeof globalThis.crypto.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : Math.random().toString(36).slice(2);

/**
 * The instance of the broadcast channel.
 */
let channelInstance: BroadcastChannel | null = null;

/**
 * Gets the instance of the broadcast channel.
 */
export function getChannel(): BroadcastChannel | null {
  if (
    typeof window === "undefined" ||
    typeof globalThis.BroadcastChannel === "undefined"
  ) {
    return null;
  }

  if (channelInstance === null) {
    channelInstance = new globalThis.BroadcastChannel(CHANNEL_NAME);
  }

  return channelInstance;
}

export function broadcast(message: StorageBroadcastMessage): void {
  const channel = getChannel();
  if (!channel) {
    console.warn("Cannot broadcast message: Broadcast channel not found");
    return;
  }
  channel.postMessage(message);
}

export function onBroadcast(
  handler: (message: StorageBroadcastMessage) => void,
): () => void {
  const channel = getChannel();
  if (!channel) {
    console.warn("Cannot subscribe to broadcast: Broadcast channel not found");
    return () => {};
  }

  const listener = (event: MessageEvent<StorageBroadcastMessage>) => {
    if (event.data?.sourceTabId !== TAB_ID) {
      handler(event.data);
    }
  };

  channel.addEventListener("message", listener);

  return () => channel.removeEventListener("message", listener);
}
