type EventCallback = (...args: any[]) => void;

interface EventBus {
  on(event: string, callback: EventCallback): void;
  off(event: string, callback: EventCallback): void;
  emit(event: string, ...args: any[]): void;
  events: Record<string, EventCallback[]>;
}

const eventBus: EventBus = {
  events: {} as Record<string, EventCallback[]>,
  
  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  },
  
  off(event: string, callback: EventCallback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((cb: EventCallback) => cb !== callback);
    }
  },
  
  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(...args));
    }
  }
};

// Event types
export const EVENTS = {
  SOCIAL_POST_CREATED: 'SOCIAL_POST_CREATED',
  VEHICLE_EVENT_CREATED: 'VEHICLE_EVENT_CREATED',
  ACTIVITY_UPDATED: 'ACTIVITY_UPDATED'
};

export default eventBus;
