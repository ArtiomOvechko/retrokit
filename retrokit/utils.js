export class LinkedList {

    constructor() {
        this.head = null;
    }

    forEach(elementFunction) {
        let currentElement = this.head;
        while (currentElement) {
            elementFunction(currentElement.value);

            currentElement = currentElement.next;
        }
    }

    _forEach(elementFunction) {
        let currentElement = this.head;
        while (currentElement) {
            elementFunction(currentElement);

            currentElement = currentElement.next;
        }
    }

    contains(value) {
        let complete = false;
        let result = false;
        this._forEach(e => {
            if (complete)
                return;

            if (e.value === value) {
                result = true;
                complete = true;
            }
        });

        return result;
    }

    remove(value) {
        let complete = false;
        this._forEach(e => {
            if (complete)
                return;

            if (e.value === value) {
                complete = true;
                if (e.prev)
                    e.prev.next = e.next;
                else
                    this.head = null;

                if (e.next) {
                    const next = e.next;
                    next.prev = e.prev;

                    if (!next.prev) {
                        this.head = next;
                    }
                }

                e.prev = null;
                e.next = null;
            }
        });
    }

    toString() {
        const res = [];
        this._forEach(e => res.push(e.value));
        return JSON.stringify(res);
    }
}

export class OrderedList extends LinkedList {

    constructor(orderBy, descending) {
        super();

        this.getOrderableValue = orderBy;
        this.descending = descending;
    }

    add(value) {
        const item = new LinkedListElement(value)
        if (!this.head) {
            this.head = item;
            return;
        }

        let complete = false;
        this._forEach(e => {
            if (complete)
                return;

            const newOrderValue = this.getOrderableValue(item.value);
            const currentOrderValue = this.getOrderableValue(e.value);

            const doInsert = this.descending && newOrderValue > currentOrderValue
                || !this.descending && newOrderValue < currentOrderValue;

            if (doInsert) {
                complete = true;
                if (e.prev)
                    e.prev.next = item;
                else
                    this.head = item;

                item.prev = e.prev;
                item.next = e;

                e.prev = item;
                return;
            }

            if (!e.next) {
                complete = true;
                e.next = item;
                item.prev = e;
            }
        })
    }
}

export class LinkedListElement {
    constructor(value) {
        this.prev = null;
        this.next = null;
        this.value = value;
    }
}


export class Queue {
    constructor() {
        this.items = [];
    }

    enqueue(item) {
        this.items.push(item);
    }

    dequeue() {
        if (this.isEmpty()) {
            throw new Error("Queue is empty");
        }
        return this.items.shift();
    }

    peek() {
        return this.isEmpty() ? null : this.items[0];
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }

    clear() {
        this.items = [];
    }

    print() {
        console.log(this.items.join(" <- "));
    }
}

export function generateUUID() {
    const timestamp = Date.now().toString();
    const randomTsOffsetLeft = Math.floor(Math.random() * 10000);
    const randomTsOffsetRight = Math.floor(Math.random() * 10000);
    const ts16 = (randomTsOffsetLeft + timestamp + randomTsOffsetRight).toString(16);

    const randomTsOffsetLeft2 = Math.floor(Math.random() * 20000 + 10000);
    const randomTsOffsetRight2 = Math.floor(Math.random() * 20000 + 10000);
    const ts162 = (randomTsOffsetLeft2 + timestamp + randomTsOffsetRight2).toString(16);

    const randomNum = Math.floor(Math.random() * 10000);
    const hexRandom = randomNum.toString(16).padStart(4, '0');

    return `${ts16.slice(0, 8)}-${ts16.slice(8, 12)}-4${ts16.slice(12, 15)}-${(parseInt(hexRandom.charAt(0), 16) & 0x3 | 0x8).toString(16)}${hexRandom.slice(1)}${ts162.slice(12,20)}-${ts162.slice(0,11)}${ts16.slice(16, 20)}`;
}

export function distanceBetween(x, y, gameObject) {
    if (!gameObject)
        return Infinity;
    return Math.sqrt(Math.pow(x - gameObject.x, 2) + Math.pow(y - gameObject.y, 2));
}