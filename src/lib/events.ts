// Simple event bus for cross-component communication
type EventCallback = () => void;

class EventBus {
    private listeners: { [key: string]: EventCallback[] } = {};

    on(event: string, callback: EventCallback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        return () => this.off(event, callback);
    }

    off(event: string, callback: EventCallback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    emit(event: string) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(cb => cb());
    }
}

export const messageEvents = new EventBus();
